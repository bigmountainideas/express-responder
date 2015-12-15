var async = require('async');
var path = require('path');
var request = require( 'supertest');
var responder = require( '../index');
var createApp = require('./support/app').createApp;


describe('respond', function(){

  it('should respond 406 with invalid content type', function(done){

    var app = createApp();
    app.use(responder.continue());

    app.get('/', function(req,res,next){
      res.continueOrError(null, {a:1,b:true}, next);
      next();
    });

    app.use(responder.respond());

    request(app)
    .get('/')
    .set('Accept', 'application/invalid')
    .expect(406, done);

  });

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
    .expect('Content-Type', /json/)
    .expect(200)
    .end(function(err, res){
      res.should.be.json;
      done(err);
    });

  });

  it('should respond with jsonp', function(done){

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
    .query({
      callback: '__aJSONCallback'
    })
    .expect('Content-Type', /javascript/)
    .expect(200)
    .end(function(err, res){
      res.text.should.startWith(
        '/**/ typeof __aJSONCallback === \'function\' && __aJSONCallback('
      );
      done(err);
    });

  });

  it('should respond with xml', function(done){
    var app = createApp();
    app.use(responder.continue());

    app.get('/', function(req,res,next){
      res.continueOrError(null, {a:1,b:true}, next);
    });

    app.use(responder.respond());

    request(app)
    .get('/')
    .set('Accept', 'application/xml')
    .expect('Content-Type', /xml/)
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
      res.template('home');
      res.continueOrError(null, {title:'a Test page',content:'hello world!'}, next);
    });

    app.use(responder.respond());

    request(app)
    .get('/')
    .set('Accept', 'text/html')
    .expect(200)
    .expect('Content-Type', /html/)
    .end(function(err, res){
      res.should.be.html;
      res.text.should.startWith('<!DOCTYPE html>');
      done(err);
    });
  });

  it('should handle html template errors', function(done){
    var app = createApp();

    app.set('views', path.resolve(__dirname,'./fixtures/views'));
    app.set('view engine', 'jade');

    app.use(responder.continue());

    app.get('/', function(req,res,next){
      res.template('no existent template');
      res.continueOrError(null, {title:'a Test page',content:'hello world!'}, next);
    });

    app.use(responder.respond());

    request(app)
    .get('/')
    .set('Accept', 'text/html')
    .expect('Content-Type', /html/)
    .expect(500)
    .end(function(err, res){
      res.should.be.html;
      res.text.should.containEql('Failed to lookup view');
      done(err);
    });
  });

  describe('with errors', function(){

    it('should respond with error', function(done){
      var app = createApp();

      app.use(responder.continue());

      app.get('/', function(req,res,next){
        next( new Error('A native error object.'));
      });

      app.use(responder.respond());

      request(app)
      .get('/')
      .set('Accept', 'application/json')
      .end(done);
    });

  });

  describe('next(err)', function(){

    it('should respond with error', function(done){
      var app = createApp();

      app.use(responder.continue());

      app.get('/', function(req,res,next){
        next( new Error('A native error object.'));
      });

      app.use(responder.respond());

      request(app)
      .get('/')
      .set('Accept', 'application/json')
      .end(done);
    });

  });

  describe('when passing options.respondWith', function(){

    var app = createApp();

    before(function(done){
      app.use(responder.continue());

      app.get('/', function(req,res,next){
        res.continueOrError(null,{},next);
      });

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

      done();
    });

    it('should respond for `text`', function(done){

      request(app)
      .get('/')
      .set('Accept', 'text/plain')
      .expect(200, 'text', done);

    });

    it('should respond for `json`', function(done){

      request(app)
      .get('/')
      .set('Accept', 'application/json')
      .expect(200, 'json', done);
    });

    it('should respond for `jsonp`', function(done){

      request(app)
      .get('/')
      .set('Accept', 'application/json')
      .query({
        callback: '__aJSONCallback'
      })
      .expect(200, 'jsonp', done);
    });

    it('should respond for `xml`', function(done){

      request(app)
      .get('/')
      .set('Accept', 'application/xml')
      .expect(200, 'xml', done);
    });

    it('should respond for `html`', function(done){

      request(app)
      .get('/')
      .set('Accept', 'text/html')
      .expect(200, 'html', done);
    });


    it('should respond for `default`', function(done){

      request(app)
      .get('/')
      .set('Accept', 'text/invalid type')
      .expect(200, 'default', done);
    });

  });


});
