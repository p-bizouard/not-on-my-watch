
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , User = mongoose.model('User')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , AWS = require('aws-sdk')

  AWS.config.update(config.aws)


var login = function (req, res) {
  var redirectTo = req.session.returnTo ? req.session.returnTo : '/'
  delete req.session.returnTo
  res.redirect(redirectTo)
}

exports.passwordReset = function(req, res) {
  User.findOne({ password_reset_key: req.params.key }, function (err, user) {
    if (err || !user)
    {
      res.render('layout', {
        errors: ['Unknown user, we can\'t reset your password']
      })
    }
    else
    {
      var new_pass = User.generateKey(8)
      user.password = new_pass
      user.save()

      var ses = new AWS.SES({apiVersion: '2010-12-01'});
      ses.sendEmail({
         Source: config.mail_from, 
         Destination: { ToAddresses: [ user.email ] },
         Message: {
             Subject:  {
                Data: 'New password'
             }, Body: {
                 Text: { Data: 'Your new password is : ' + new_pass + '' }
              }
         }
      }, function(err, data) {
          if(err)
          {
            console.log(err)
            res.render('layout', {
              errors: ['An error occured : we can\'t send email']
            })
          }
          else
          {
            res.render('layout', {
              success: ['An email has been sent with your new password.']
            })
          }
       })
    }
  })
}

exports.profile = function (req, res) {
  User.findOne({ _id: req.user._id }, function (err, user) {
    if (err || !user)
      res.json({ success: false, message:'An error occured : user do not exists' })
    else
    {
      User.findOne({ email: req.body.email }, function (err, user2) {
        if (err || (user2 && !user2._id.equals(req.user._id)))
        {
          res.json({ success: false, message:'An error occured : this email is already registered' })
        }
        else
        {
            if (req.body.password != '')
              user.password = req.body.password;

            user.email = req.body.email;
            user.save();
            res.json({ success: true, message:'Profile successfuly updated' })
        }
      })
    }
  })
}

exports.signin = function (req, res) {
  User.findOne({ email: req.body.email }, function (err, user) {
    if (err || !user)
      res.json({ success: false, message:'An error occured : user do not exists' })
    else
    {
      if (req.body.login_state == 'reset')
      {
        var key = User.generateKey(30);
        var link = 'http://' + config.host + '/password-reset/' + key;

        user.password_reset_key = key;
        user.save();

        var ses = new AWS.SES({apiVersion: '2010-12-01'});
        ses.sendEmail({
           Source: config.mail_from, 
           Destination: { ToAddresses: [ user.email ] },
           Message: {
               Subject:  {
                  Data: 'Reset your password'
               }, Body: {
                   Text: { Data: 'To reset your password, click this link : ' + link + '' },
                   Html: { Data: 'To reset your password, click this link : <a href="' + link + '">' + link + '</a>' }
                }
           }
        }, function(err, data) {
            if(err)
            {
              console.log(err)
              res.json({ success: false, message:'An error occured : we can\'t send email' })
            }
            else
              res.json({ success: true, message:'An email has been sent.' })
         });
      }
      else if (req.body.login_state == 'signin')
      {
        if (!user.authenticate(req.body.password))
          res.json({ success: false, message:'An error occured : wrong email or password' })
        else
        {
          req.logIn(user, function(err) {
           res.json({ success: true })
          })
        }
      }
    }
  })
}

/**
 * Auth callback
 */

exports.authCallback = login

/**
 * Show login form
 */

exports.login = function (req, res) {
  res.render('users/login', {
    title: 'Login',
    message: req.flash('error')
  })
}

/**
 * Logout
 */

exports.logout = function (req, res) {
  req.logout()
  res.redirect('/')
}

/**
 * Session
 */

exports.session = login

/**
 * Create user
 */

exports.signup = function (req, res, next) {
  var user = new User(req.body)
  user.provider = 'local'
  user.save(function (err) {
    if (err)
    {
      res.json({ success: false, errors: err.errors })
    }
    else
    {
      req.logIn(user, function(err) {
       res.json({ success: true })
      })
    }
  })
}

/**
 *  Show profile
 */

exports.show = function (req, res) {
  var user = req.profile
  res.render('users/show', {
    title: user.name,
    user: user
  })
}

/**
 * Find user by id
 */

exports.user = function (req, res, next, id) {
  User
    .findOne({ _id : id })
    .exec(function (err, user) {
      if (err) return next(err)
      if (!user) return next(new Error('Failed to load User ' + id))
      req.profile = user
      next()
    })
}
