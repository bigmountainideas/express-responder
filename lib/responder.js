/*!
 *
 * Express.js Responder
 * https://github.com/bigmountainideas/express-responder
 *
 *
 * (The MIT License)
 *
 * Copyright (c) 20014 Big Mountain Ideas + Innovations
 * Jovan Alleyne <jovan@bigmountainideas.com>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the 'Software'), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE
 * AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
 * FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 *
 */


/**
 * Import module dependencies
 *
 * @api private
 */
var _ = require('underscore');
var debug = require('debug')('express-responder');
var validator = require('express-validator');
var errors = require('errors');
var moment = require('moment');
var xml = require('js2xmlparser');

/**
 * Object to be exported
 *
 * @api private
 */
var exports = module.exports;




/**
 * Expose middleware adding helper methods to the express.js
 * `Request` and `Response` objects.
 *
 * @param {Object} options
 * @return {Array} middleware
 * @api public
 */
exports.continue = function(options){

  // Default options for module
  var defaults = {
    errors: errors,
    validator: {}
  };

  // Merge user options with defaults
  options = _.defaults(options || {}, defaults);

  // Create the middleware stack to pass to `app.use()`.
  var middlewareStack = [
    // Pass `express-validator` as the first middleware.
    validator( options.validator)
  ];


  /**
   * Create a middleware function that adds the supporting
   * methods to an express/ connect request and response.
   *
   * @param {ServerRequest} req
   * @param {ServerResponse} res
   * @param {Function} next
   * @api private
   */
  middlewareStack.push(function( req, res, next){

    debug( 'Registering response middleware for path: %s', req.path);

    /**
     * Check the request and respond if any errors are found.
     *
     * @param {Array|Object} errs
     * @param {Function} next
     * @api private
     */
    req.continueOrError = function(errs,next){
      // Check for validation errors from `express-validator` module
      var validatorErrors = req.validationErrors();
      var error;

      // Check if `errs` argument or `validatorErrors` are set and
      // create a 400 error instance to forward along to the response.
      if( errs || validatorErrors){
        debug('Responding with error');
        error = new options.errors.Http400Error({
          // Combine and save the specific `errors` for access
          // by the client.
          errors: [].concat( (errs || []), (validatorErrors || []))
        });
      }

      // Call the next callback with the error.
      if(typeof next === 'function'){
        next(error);
      }

      // Return `true` if there was an error, `false` otherwise.
      return !!error;
    };


    /**
     * Determine based on `data` and `err` arguments weather
     * there is an error or the request can continue.
     *
     * @param {Object} err
     * @param {Object} data
     * @return {Boolean}
     * @api public
     */
    res.shouldContinue = function(err,data){
      debug( 'Should continue %s', (data && !err));
      // Passing only one argument will assume checking `err`.
      if( arguments.length === 1) return !err;
      // Otherwise check both `err` and `data` arguments.
      return (data && !err);
    };

    /**
     * Check the value passed and respond with it as an error
     * returning `true`, or return `false`.
     *
     * @param {Object} err
     * @param {Function} next
     * @return {Boolean}
     * @api public
     */
    res.respondIfError = function(err,next){
      // Check `err` argument
      if( err){
        debug( '[HttpError] %j', err);

        // Check if err inherits from HttpError
        if( !(err instanceof options.errors.HttpError)){
          // Convert err to HttpError
          err = new options.errors.Http500Error({
            explanation: err.message
          });
        }

        // Execute the callback passing the error
        if( typeof next === 'function'){
          next( err);
        }

        // Save error to repsonse
        res.locals.response = err;
        return true;
      }else{
        debug( 'No errors in response');
        return false;
      }
    };

    //
    res.continueOrError = function(err,data,next){
      debug( 'Responding to path %s', req.path);
      debug( 'Continue or error [%j] [%j]', err, data);

      if( !res.respondIfError( err, next)){
        debug( 'Continuing with response');
        if( !data && !err){
          debug( 'Resource not found');
          if( typeof next === 'function'){
            next(new options.errors.Http404Error());
          }
          return false;
        }else{
          res.locals.response = data;
          if( typeof next === 'function'){
            next();
          }
        }
      }
      return true;
    };

    //
    res.continue = function(data,next){
      if( data){
        res.locals.response = data;
      }
      if( typeof next === 'function'){
        next();
      }
    };

    //
    res.template = function(val){
      res.locals.__template = val;
      return this;
    };

    next();

  });

  return middlewareStack;
};


/*!
 * Respond middleware
 */
exports.respond = function(options){


  /*!
   * Default options for module
   */
  var defaults = {
    errors: errors,
    jsonpCallbackName: 'callback',
    views: {
      default : 'index',
      error   : 'error',
      http500 : '500',
      http404 : '404'
    }
  };


  options = _.defaults(options || {}, defaults);

  options.errors.stacks( -1 !== ([
    'development',
    'test'
  ]).indexOf( process.env.NODE_ENV));

  var respondNotFound = function(req,res,next){
    if( !res.locals.response){
      next(new errors.Http404Error());
    }else{
      next();
    }
  };

  var respondWithError = function(err,req,res,next){
    if( !err || (err && !(err instanceof errors.HttpError))){

      var stack, errOpts = {};
      if( err){
        errOpts.explanation = err.toString();
      }
      if( options.errors.stacks() && err && (stack=err.stack)){
        errOpts.originalStack = stack;
      }
      err = new options.errors.Http500Error(errOpts);
    }

    res.locals.response = {
      error : err.toJSON && err.toJSON(),
      date  : moment().format()
    };

    res.status(err.status || 500);

    next();
  };

  var htmlViews = options.views;

  var viewForResponse = function(status){
    return htmlViews['http'+status] ||
            htmlViews.error ||
            htmlViews.default;
  };

  var respondWith = {

    text: function(res, response){
      res.send(response.toString());
    },

    xml: function(res, response){
      res.send(xml('response',response));
    },

    html: function(res, response){

      var templateName = res.locals.__template;

      if( !templateName){
        if( response.hasOwnProperty('error')){
          templateName = viewForResponse(res.status);
        }else{
          templateName = htmlViews.default;
        }
      }

      res.render( templateName, response, function(err, html){
        if( !err){
          debug( 'Html template successfully rendered.' );
          res.send( html);
        }else{
          debug( 'Error rendering Html template with name \'%s\'', templateName );
          var renderError = new options.errors.Http500Error({
            explanation   : err.message,
            originalStack : err.stack
          });

          res.status(renderError.status)
          .render( viewForResponse(renderError.status), {
            error: renderError.toJSON()
          });
        }
      });
    },

    json: function(res, response){
      res.json(response);
    },

    jsonp: function(res, response){
      res.jsonp(response);
    },

    default: function(res, response){
      res.status(406).send('Not Acceptable');
    }
  };

  respondWith = _.defaults(options.respondWith || {}, respondWith);

  var sendResponse = function(req,res,next){
    var self = this, response = res.locals.response;

    if( response && !response.hasOwnProperty('error')){
      response = {
        data: response
      };
    }

    res.format({
      text: function(){
        respondWith.text( res, response);
      },

      xml: function(){
        respondWith.xml( res, response);
      },

      html: function(){
        respondWith.html( res, response);
      },

      json: function(){
        if( req.query.hasOwnProperty(options.jsonpCallbackName)){
          respondWith.jsonp( res, response);
        }else{
          respondWith.json( res, response);
        }
      },

      default: function(){
        respondWith.default( res, response);
      }
    });
  };

  return [ respondNotFound, respondWithError, sendResponse];
};
