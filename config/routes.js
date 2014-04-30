/*!
 * Module dependencies.
 */

var async = require('async')

/**
 * Controllers
 */

var users = require('../app/controllers/users')
  , searches = require('../app/controllers/searches')
  , posts = require('../app/controllers/posts')
  , auth = require('./middlewares/authorization')

/**
 * Expose routes
 */

module.exports = function (app, passport) {

  /**
   * Users
   */  
  app.param('userId', users.user)
  app.get('/logout', users.logout)
  app.get('/password-reset/:key', users.passwordReset)
  app.post('/user/signup', users.signup)
  app.post('/user/signin', users.signin)
  app.post('/user/profile', users.profile)

  /**
   * Searches
   */  
  app.param('searchId', searches.load)
  app.get('/api/search', searches.getList)
  app.post('/api/search', searches.create)
  app.get('/api/search/:searchId', searches.getDetail)
  app.put('/api/search/:searchId', searches.update)
  app.delete('/api/search/:searchId', searches.delete)

  
  /**
   * Posts
   */  
  app.param('postId', searches.loadPost)
  app.get('/api/search/:searchId/post/:postId', searches.getPost) // Access post via search to get the read status
  app.get('/api/post/crawl', posts.crawl)
  
  app.get('/auth/facebook',
    passport.authenticate('facebook', {
      scope: [ 'email', 'user_about_me'],
      failureRedirect: '/login'
    }), users.signin)
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      failureRedirect: '/login'
    }), users.authCallback)

  /**
   * Angular
   */  
  app.get('/template/:privacy/:page.html', function(req, res) {
    res.render('angular/' + req.params.privacy + '/' + req.params.page)
  });
  app.get('/template/:privacy/:cat/:page.html', function(req, res) {
    res.render('angular/' + req.params.privacy + '/' + req.params.cat + '/' + req.params.page)
  });
  app.get('/*', function(req, res) {
    res.render('layout')
  });
}
