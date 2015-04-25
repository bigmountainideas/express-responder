var express = require( 'express');
var bodyParser = require( 'body-parser');

module.exports.createApp = function(){
  var app = express();
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  return app;
};
