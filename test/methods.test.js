var path = require('path');
var request = require( 'supertest');
var responder = require( '../index');
var createApp = require('./support/app').createApp;


describe('req.continueOrError', function(){

  it('should return an error and status 400', function(done){

    var app = createApp();
    app.use(responder.continue());

    app.get('/', function(req,res,next){
      req.continueOrError(new Error('A random error'), next);
      next();
    });

    app.use(responder.respond());

    request(app)
    .get('/')
    .set('Accept', 'application/json')
    .expect(400)
    .end(function(err, res){
      res.body.should.have.property('error');
      res.body.error.should.have.property('errors');
      done(err);
    });

  });
});

describe('res', function(){

  describe('.shouldContinue', function(){

      it('should return true with no error', function(done){

        var app = createApp();
        app.use(responder.continue());

        app.get('/', function(req,res,next){
          res.shouldContinue(null,{}).should.be.ok;
          done();
        });

        app.use(responder.respond());

        request(app)
        .get('/')
        .set('Accept', 'application/json')
        .end();

      });

      it('should return false with error', function(done){

        var app = createApp();
        app.use(responder.continue());

        app.get('/', function(req,res,next){
          res.shouldContinue(
            new Error('Do not continue'),{}
          ).should.not.be.ok;
          done();
        });

        app.use(responder.respond());

        request(app)
        .get('/')
        .set('Accept', 'application/json')
        .end();

      });
  });

  describe('.respondIfError', function(){

    it('should return true and respond 500 with error', function(done){

      var app = createApp();
      app.use(responder.continue());

      app.get('/', function(req,res,next){
        res.respondIfError(
          new Error('Respond with error'), next
        ).should.be.ok;
      });

      app.use(responder.respond());

      request(app)
      .get('/')
      .set('Accept', 'application/json')
      .expect(500, done);

    });

    it('should return false with no error', function(done){

      var app = createApp();
      app.use(responder.continue());

      app.get('/', function(req,res,next){
        res.respondIfError(
          null, next
        ).should.not.be.ok;
        done();
      });

      app.use(responder.respond());

      request(app)
      .get('/')
      .set('Accept', 'application/json')
      .end(done);

    });

  });


  describe('.continueOrError', function(){

    it('should return false and respond 404 with no error and no data', function(done){

      var app = createApp();
      app.use(responder.continue());

      app.get('/', function(req,res,next){
        res.continueOrError(null, null, next).should.not.be.ok;
      });

      app.use(responder.respond());

      request(app)
      .get('/')
      .set('Accept', 'application/json')
      .expect(404, done);

    });

    it('should return false and respond 500 with error and data', function(done){

      var app = createApp();
      app.use(responder.continue());

      app.get('/', function(req,res,next){
        res.continueOrError(
          new Error('Something is wrong.'), {success:true}, next
        ).should.be.ok;
      });

      app.use(responder.respond());

      request(app)
      .get('/')
      .set('Accept', 'application/json')
      .expect(500, done);

    });

    it('should return true and respond 200 with no error and data', function(done){

      var app = createApp();
      app.use(responder.continue());

      app.get('/', function(req,res,next){
        res.continueOrError(null, {success:true}, next).should.be.ok;
      });

      app.use(responder.respond());

      request(app)
      .get('/')
      .set('Accept', 'application/json')
      .expect(200, done);

    });

  });


});
