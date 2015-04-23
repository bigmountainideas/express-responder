/**
 *
 *
 *
 *
 */


var debug = require('debug');
var validator = require('express-validator');
var errors = require('errors');

var exports = module.exports = function(options){
  var log = debug(options.debug || 'express-responder');
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
        return true;
      }else{
        log( 'No errors in response');
        return false;
      }
    }

    //
    res.continueOrError = function(err,data,next){
      log( 'Responding to path %s', req.path);
      log( 'Continue or error [%j] [%j]', err, data);

      var respondedWithError = res.respondIfError( err, next);

      if( !respondedWithError){
        log( 'Continuing with response');
        if( !data && !err){
          log( 'Resource not found');
          if( typeof === 'function'){
            next(new errors.Http404Error());
          }
          return false;
        }else{
          res.locals({ response: data});
          if( typeof === 'function'){
            next();
          }
        }
      }
      return true;
    }

    next();

  });

  return middlewareStack;
};
