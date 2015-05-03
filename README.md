Express.js Responder
--------------------

Express.js middleware abstracting error vs success responses.

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]

### INSTALLING

```$ npm install express-responder --save```

### FEATURES

* Middleware control flow
* Uniformed error handling
* Request validation
* Response validation
* Content-Type repsonse negotiation

### USAGE

The rationale behind this module is to reduce the amount of repetitive code required to validate a request cycle in express.js/ connect. Ever find yourself writing code like this?

```js
function(req,res,next){
  UserModel.findOne({
    _id:"anemail@adomain.com"
  }, function(err, user){

    if( err){
      res.send(500, err);
    }else{
      res.send(user);
    }
  });
}
```

We were tired of seeing this throughout our express.js apps so this module was born, converting the above into this:

```js
function(req,res,next){
  UserModel.findOne({
    _id:"anemail@adomain.com"
  }, function(err, user){
    res.continueOrError(err, user, next);
  });
}
```



Basic usage
```js
var responder = require('express-responder')();
var express = require('express');
var app = express();

app.use(responder.continue());
// ... Other middleware like session and static

app.get('/api/v1/users', function(req,res,next){
  UserModel.find()
  .exec(function(err, user){
    res.continueOrError(err, user, next);
  });
});

// ... After all your routes
app.use(responder.respond());
```


### API


###### Middleware

* ``` responder.continue() ```

  Register the middleware exposing the methods below on request and response objects.

* ``` responder.respond([options]) ```

  Register middleware to handle 404 and Error responses, along with content negotiation. Supports `html`, `json`, `xml`, `jsonp`, and `text`.

  **Options**

  * ###### jsonpCallbackName

    Change the querystring parameter used to detect a JSONP request.

    *__Default__: 'callback'*

    ```js
    app.set('jsonp callback name', '__jsonpCallback__');

    app.use(responder.respond({
      jsonpCallbackName: app.get('jsonp callback name')
    });
    ```
    
  * ###### respondWith

    Pass custom callbacks for each content-type.

    ```js
    app.use(responder.respond({
      respondWith: {
        text: function(res, response){
          res.send('text');
        },
        json: function(res, response){
          res.type('text').send('json');
        },
        jsonp: function(res, response){
          res.type('text').send('jsonp');
        },
        xml: function(res, response){
          res.send('xml');
        },
        html: function(res, response){
          res.send('html');
        },
        default: function(res, response){
          res.send('default');
        }
      }
    }));
    ```

###### Request Methods

* ``` req.continueOrError(err, next) ```

  Check the request for errors using either [express-validator](https://www.npmjs.com/package/express-validator) methods or pass your own custom errors as the first parameter. If an error is found, the response will be an `Http400Error`.

  ```js

  var users = {
    1: {
      books: [
        'Growth Engines',
        'It\'s Not About The F-Stops'
      ]
    },
    2: {
      books: [
        'Design For How People Learn',
        'Smart Information Systems'
      ]
    }
  };

  app.get('/api/v1/user/:id/books', function(req,res,next){
    // Do some request validation on `id` parameter.
    req.checkParams('id').isInt();

    // Custom validation
    var err;
    if( !users.hasOwnProperty(req.params.id)){
      err = new Error('User does not exist');
    }

    // If id is not a number or an error is passed as the first
    // parameter, the error will get returned to the client as
    // 400 status.
    req.continueOrError(err, next);
  });
  ```

###### Response Methods

* ``` res.shouldContinue(err, data) ```

  Convenience method that returns `true` if there is data and there is no error, `false` otherwise. If you need to check for an error and still do more before actually responding.

  ```js
  app.get('/api/v1/user/:id/books', function(req,res,next){
    async.parallel({
      user: function(done){
        done(null, {name:'John'});
      },
      book: function(done){
        done(null, {book:'Hello World!'});
      }
    }, function(err, results){

      if( res.shouldContinue(err, results)){

        var book = results[1].book;
        var user = results[0].name;

        var responseData = {
          user: user,
          book: book
        };

        res.continueOrError(err, responseData, next);
      }else{
        next(new Error('There was an error.'));
      }

    });
  });
  ```


* ``` res.respondIfError(err, next) ```

  Responds if an error was passed and return `true` otherwise just return `false` allowing for further processing inside middleware.

  ```js
  app.get('/api/v1/user/:id/books', function(req,res,next){

    UserModel.findOne({
      _id: req.params.id
    }, function(err, user){

      if( !res.respondIfError(err,next)){
        BooksModel.find({
          _id: user.books[0]
        }, function(err, books){
          res.continueOrError(err, books, next);
        });
      }

    });

  });
  ```

* ``` res.continueOrError(err, data, next) ```

  Continue onto next matching middleware saving `data` as `res.locals.response` or respond with `error`.

  ```js
  app.get('/api/v1/users', function(req,res,next){
    UserModel.find()
    .exec(function(err, user){
      res.continueOrError(err, user, next);
    });
  });
  ```


### DEBUG

Debugging is implemented using the [debug](http://npmjs.org/packages/debug) module.

```$ DEBUG=express-responder npm start```

```js
process.env.DEBUG = 'express-responder'
```


### DEPENDENCIES

"Bernard of Chartres used to compare us to [puny] dwarfs perched on the shoulders of giants. He pointed out that we see more and farther than our predecessors, not because we have keener vision or greater height, but because we are lifted up and borne aloft on their gigantic stature." [Quoted From](http://en.wikipedia.org/wiki/Standing_on_the_shoulders_of_giants)

This module is primarily built on:

* [debug](https://www.npmjs.com/package/debug)
* [errors](https://www.npmjs.com/package/errors)
* [express-validator](https://www.npmjs.com/package/express-validator)

and all of the other modules that make up these packages.


### LICENSE

```
(The MIT License)

Copyright (c) 20014 Big Mountain Ideas + Innovations <jovan@bigmountainideas.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```


[npm-image]: https://img.shields.io/npm/v/express-responder.svg
[npm-url]: https://npmjs.org/package/express-responder
[downloads-image]: https://img.shields.io/npm/dm/express-responder.svg
[downloads-url]: https://npmjs.org/package/express-responder
[travis-image]: https://img.shields.io/travis/bigmountainideas/express-responder/master.svg
[travis-url]: https://travis-ci.org/bigmountainideas/express-responder
[coveralls-image]: https://coveralls.io/repos/bigmountainideas/express-responder/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/r/bigmountainideas/express-responder?branch=master
