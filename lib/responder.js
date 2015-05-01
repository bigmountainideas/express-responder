/**
 *
 *
 *
 *
 */


/*!
 * Import module dependencies
 */
var _ = require('underscore');
var debug = require('debug');
var validator = require('express-validator');
var errors = require('errors');
var moment = require('moment');
var xml = require('js2xmlparser');

/*!
 * Object to be exported
 */
var exports = module.exports;


/*!
 * Default options for module
 */
exports.defaults = {
  debug: 'express-responder'
};


/*!
 * Continue middleware
 */
exports.continue = function(options){
  options = _.defaults(options || {}, exports.defaults);
  var log = debug(options.debug);
  var middlewareStack = [ validator() ];

  middlewareStack.push(function( req, res, next){

    log( 'Registering response middleware for path: %s', req.path);

    //
    req.continueOrError = function(errs,next){
      if( arguments.length === 1){
        next = arguments[0];
      }
      if( arguments.length > 1){
        errs = null;
      }
      var validatorErrors = req.validationErrors();
      var error;
      if( errs || validatorErrors){
        error = new errors.Http400Error({
          errors: [].concat( (errs || []), (validatorErrors || []))
        });
      }
      if(typeof next === 'function'){
        next(error);
      }
    };


    //
    res.shouldContinue = function(err,data){
      log( 'Should continue %s', (data && !err));
      return (data && !err);
    };

    //
    res.respondIfError = function(err,next){
      if( err){
        log( '[HttpError] %j', err);
        if( typeof next === 'function'){
          next( new errors.Http500Error({
            explanation: err.message
          }));
        }
        return true;
      }else{
        log( 'No errors in response');
        return false;
      }
    };

    //
    res.continueOrError = function(err,data,next){
      log( 'Responding to path %s', req.path);
      log( 'Continue or error [%j] [%j]', err, data);

      var respondedWithError = res.respondIfError( err, next);

      if( !respondedWithError){
        log( 'Continuing with response');
        if( !data && !err){
          log( 'Resource not found');
          if( typeof next === 'function'){
            next(new errors.Http404Error());
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

    next();

  });

  return middlewareStack;
};


/*!
 * Respond middleware
 */
exports.respond = function(options){

  errors.stacks( -1 !== ([
      'development',
      'test'
    ]).indexOf( process.env.NODE_ENV)
  );

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
      if( errorr.stacks() && err && (stack=err.stack)){
        errOpts.originalStack = stack;
      }
      err = new errors.Http500Error(errOpts);
    }

    res.locals.response = {
      error : err,
      date  : moment().format()
    };

    res.status(err.status || 500);

    next();
  };

  var sendResponse = function(req,res,next){
    var response = res.locals.response;

    if( !response.hasOwnProperty('error')){
      response = {
        data: response
      };
    }

    res.format({
      text: function(){
        res.send(response.toString());
      },

      xml: function(){
        res.send(xml('data',response.data));
      },

      html: function(){

        res.render( res.template, response, function(err, html){

          if( !err){
            res.send( html);
          }else{

            var renderError = new errors.Http500Error({
              explanation   : err.message,
              originalStack : err.stack
            });

            res.status(renderError.status)
            .render( 'error', {
              error: renderError.toJSON()
            });
          }

        });
      },

      json: function(){
        res.json(response);
      },

      jsonp: function(){
        res.jsonp(response);
      },

      'default': function(){
        res.status(406).send('Not Acceptable');
      }
    });
  };

  return [ respondNotFound, respondWithError, sendResponse];
};
