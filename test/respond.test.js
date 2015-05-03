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
      res.should.be.json;
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
      res.text.should.eql('<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<response>\n\t<data>\n\t\t<a>1</a>\n\t\t<b>true</b>\n\t</data>\n</response>');
      done(err);
    });
  });

  it('should respond with html', function(done){
    var app = createApp();

    app.set('views', path.resolve(__dirname,'./fixtures/views'));
    app.set('view engine', 'jade');

    app.use(responder.continue());

    app.get('/', function(req,res,next){
      res.template = 'home';
      res.continueOrError(null, {title:'a Test page',content:'hello world!'}, next);
      next();
    });

    app.use(responder.respond());

    request(app)
    .get('/')
    .set('Accept', 'text/html')
    .expect(200)
    .end(function(err, res){
      res.should.be.html;
      res.text.should.startWith('<!DOCTYPE html>');
      done(err);
    });
  });

});
