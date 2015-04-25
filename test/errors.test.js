var request = require( 'supertest');
var errors = require( 'errors');
var responder = require( '../index');
var createApp = require('./support/app').createApp;


describe( 'errors', function(){

  it( 'should return 400 when passing an `Http400Error` to the next middleware', function(done){

    var app = createApp();
    app.use(responder.continue());

    app.get('/', function(req,res,next){
      next(new errors.Http400Error());
    });

    app.use(responder.respond());

    request(app)
    .get('/')
    .set('Accept', 'application/json')
    .expect(400, done);

  });

});
