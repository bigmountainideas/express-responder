Express.js Responder
--------------------

Express.js middleware abstracting error vs success responses.

[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build][travis-image]][travis-url]

### INSTALLING

```$ npm install express-responder --save```

### FEATURES

* Middleware control flow
* Uniformed error handling
* Request validation

### USAGE

The rationale behind this module is to reduce the amount of repetitive code required to validate a request cycle in express.js/ connect. Ever find yourself writing code like this?

```javascript
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

```javascript
function(req,res,next){
  UserModel.findOne({
    _id:"anemail@adomain.com"
  }, function(err, user){
    res.continueOrError(err, user, next);
  });
}
```



Basic usage
```javascript
var responder = require('express-responder')();
var express = require('express');
var app = express();

express.use(responder.continue());
// ... Other middleware like session and static

app.get('/api/v1/users', function(req,res,next){
  User.findOne({
    email: "anemail@adomain.com"
  })
  .exec(function(err, user){
    res.continueOrError(err, user, next);
  });
});

app.get('/api/v1/user/:id/books', function(req,res,next){
  async.parallel({
    user: function(done){

    },
    book: function(done){

    }
  }, function(err, results){
    res.continueOrError(err, results);
  });
});

// ... After all your routes
express.use(responder.respond());
express.use(responder.handleErrors());
```


### API


Middleware

``` responder.continue([options]) ```

``` responder.respond([options]) ```

Request Methods

``` req.continueOrError(err, data, next) ```

Response Methods

``` res.shouldContinue(err, data) ```

``` res.respondIfError(err, next) ```

``` res.continueOrError(err, data, next) ```


### DEBUGGIN

Debugging is implemented using the [debug](http://npmjs.org/packages/debug) module.

```$ DEBUG=express-responder npm start```

```javascript
process.env.DEBUG = 'express-responder'
```


### DEPENDENCIES

"Bernard of Chartres used to compare us to [puny] dwarfs perched on the shoulders of giants. He pointed out that we see more and farther than our predecessors, not because we have keener vision or greater height, but because we are lifted up and borne aloft on their gigantic stature." [Quoted From](http://en.wikipedia.org/wiki/Standing_on_the_shoulders_of_giants)

This module depends on the great work of:

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
