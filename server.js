
/*!
 * nodejs-express-mongoose-demo
 * Copyright(c) 2013 Madhusudhan Srinivasa <madhums8@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var express = require('express')
  , fs = require('fs')
  , passport = require('passport')
  , pkg = require('./package.json')
/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

// Load configurations
// if test env, load example file

var env = process.env.NODE_ENV || 'development'
  , config = require('./config/config')[env]
  , mongoose = require('mongoose')

// Bootstrap db connection
// Connect to mongodb
var connect = function () {
  var options = { server: { poolSize: 25, socketOptions: { keepAlive: 1 } } }
  mongoose.connect(config.db, options)
  //mongoose.set('debug', true);
}
connect()


// Error handler
mongoose.connection.on('error', function (err) {
  console.log(err)
})

// Reconnect when closed
mongoose.connection.on('disconnected', function () {
  connect()
})

// Bootstrap models
var models_path = __dirname + '/app/models'
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file)
})

// bootstrap passport config
require('./config/passport')(passport, config)

var app = express()

// express settings
require('./config/express')(app, config, passport)


// Bootstrap routes
require('./config/routes')(app, passport)


      // Start the app by listening on <port>
      var port = process.env.PORT || 3000
      var server = app.listen(port)
      console.log('Express app started on port '+port)

      var io = require('socket.io').listen(server, { log: false });
      io.set('authorization', function (data, callback) {
          if(!data.headers.cookie) {
              return callback('No cookie transmitted.', false);
          }

          // We use the Express cookieParser created before to parse the cookie
          // Express cookieParser(req, res, next) is used initialy to parse data in "req.headers.cookie".
          // Here our cookies are stored in "data.headers.cookie", so we just pass "data" to the first argument of function
          app.cookieParser(data, {}, function(parseErr) {
              if(parseErr) { return callback('Error parsing cookies.', false); }

              // Get the SID cookie
              var sidCookie = (data.secureCookies && data.secureCookies['connect.sid']) ||
                              (data.signedCookies && data.signedCookies['connect.sid']) ||
                              (data.cookies && data.cookies['connect.sid']);

              // Then we just need to load the session from the Express Session Store
              app.sessionStore.load(sidCookie, function(err, session) {
                  // And last, we check if the used has a valid session and if he is logged in
                  if (err || !session || !session.passport || !session.passport.user ) {
                      callback('Not logged in.', false);
                  } else {
                      // If you want, you can attach the session to the handshake data, so you can use it again later
                      // You can access it later with "socket.handshake.session"
                      data.session = session;
                      
                      callback(null, true);
                  }
              });
          });
      });

      app.io = io

// expose app
exports = module.exports = app
