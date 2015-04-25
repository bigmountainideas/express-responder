var request = require( 'supertest');
var express = require( 'express');
var bodyParser = require( 'body-parser');
var responder = require( '../index');
var createApp = require('./support/app').createApp;


describe( 'middleware', function(){

  it( 'should return a an array of callbacks', function(done){

    responder.continue().should.be.instanceof( Array);

    done();
  });

  it( 'should create method `continueOrError` on all request objects', function(done){

    var app = createApp();
    app.use(responder.continue());

    app.get('/', function(req,res,next){
      req.should.have.property( 'continueOrError');
      req.continueOrError.should.be.instanceof( Function);
      done();
    });

    request(app)
    .get('/')
    .end();

  });

  it( 'should create method `shouldContinue` on all response objects', function(done){

    var app = createApp();
    app.use(responder.continue());

    app.get('/', function(req,res,next){
      res.should.have.property( 'shouldContinue');
      res.shouldContinue.should.be.instanceof( Function);
      done();
    });

    request(app)
    .get('/')
    .end();

  });

  it( 'should create method `respondIfError` on all response objects', function(done){

    var app = createApp();
    app.use(responder.continue());

    app.get('/', function(req,res,next){
      res.should.have.property( 'respondIfError');
      res.respondIfError.should.be.instanceof( Function);
      done();
    });

    request(app)
    .get('/')
    .end();

  });

  it( 'should create method `continueOrError` on all response objects', function(done){

    var app = createApp();
    app.use(responder.continue());

    app.get('/', function(req,res,next){
      res.should.have.property( 'continueOrError');
      res.continueOrError.should.be.instanceof( Function);
      done();
    });

    request(app)
    .get('/')
    .end();

  });

});
