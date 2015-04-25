var path = require('path');
var request = require( 'supertest');
var responder = require( '../index');
var createApp = require('./support/app').createApp;


describe('respond', function(){

  it('should respond with json', function(done){

    var app = createApp();
    app.use(responder.continue());

    app.get('/', function(req,res,next){
      res.continueOrError(null, {a:1,b:true}, next);
      next();
    });

    app.use(responder.respond());

    request(app)
    .get('/')
    .set('Accept', 'application/json')
    .expect(200)
    .end(function(err, res){
      done(err);
    });

  });

  it('should respond with xml', function(done){
    var app = createApp();
    app.use(responder.continue());

    app.get('/', function(req,res,next){
      res.continueOrError(null, {a:1,b:true}, next);
      next();
    });

    app.use(responder.respond());

    request(app)
    .get('/')
    .set('Accept', 'application/xml')
    .expect(200)
    .end(function(err, res){
      done(err);
    });
  });

  it('should respond with html', function(done){
    var app = createApp();

    app.set('views', path.resolve(__dirname),'./fixtures/views');

    app.use(responder.continue());

    app.get('/', function(req,res,next){
      res.continueOrError(null, {a:1,b:true}, next);
      next();
    });

    app.use(responder.respond());

    request(app)
    .get('/')
    .set('Accept', 'text/html')
    .expect(200)
    .end(function(err, res){
      done(err);
    });
  });

});
