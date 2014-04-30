
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , Schema = mongoose.Schema
  , jsdom = require("jsdom")
  ,  moment = require('moment')
  , AWS = require('aws-sdk')

  AWS.config.update(config.aws)


/**
 * Article Schema
 */

var PostSchema = new Schema({
  title: {type : String, default : '', trim : true},
  subtitle: {type : String, default : '', trim : true},
  body: {type : String, default : '', trim : true},
  url: {type : String, default : '', trim : true},
  createdAt  : {type : Date, default : Date.now}
})

/**
 * Validations
 */

PostSchema.path('title').validate(function (title) {
  return title.length > 0
}, 'Search title cannot be blank')

PostSchema.path('url').validate(function (url) {
  return url.length > 0
}, 'Search url cannot be blank')



/**
 * Methods
 */

PostSchema.methods = {
  getPostBody: function (req, res, url, try_nb) {
    var Search = mongoose.model('Search')
    var post = this

    if (typeof try_nb == 'undefined')
      try_nb = 0
    else

    if (try_nb == 4)
    {
      console.info("\t\tParse post trop de try")
      return ;
    }

    console.info("\t\tParse post try : " + try_nb)

    jsdom.env({
      url: url,
      encoding:'binary',
      scripts: ["http://code.jquery.com/jquery-1.11.0.min.js"],
      done: function (errors, window) {
        if (errors)
        {
          console.log(errors)
          return (post.getPostBody(req, res, url, ++try_nb))
        }
        console.log("\t\tParse in progress")

        var $ = window.$;
        var time_now = moment()

        post.body = $(config.crawl.selector_body).html()

        post.save(function (err) {
          Search.find({}).populate('user').exec(function(err, searches) {
            // Dirty, it's to force the process to don't loop and stay here for a long time
            var i = 0;
            function iter() {
              if (i < searches.length) {
                var regex = RegExp(searches[i].regex, 'i')
                if (regex.test(post.body))
                {
                  if (searches[i].email_alert == 'yes' && !searches[i].is_alerted && time_now.diff(moment(searches[i].last_alerted), 'seconds') > 300) // 5 minutes
                  {
                    Search.update({_id: searches[i]._id}, {is_alerted: true, last_alerted: new Date()}, function(e) {});

                    var ses = new AWS.SES({apiVersion: '2010-12-01'});
                    ses.sendEmail({
                       Source: config.mail_from, 
                       Destination: { ToAddresses: [ searches[i].user.email ] },
                       Message: {
                           Subject:  {
                              Data: '[Not on My Watch] - New match for "' + searches[i].title + '"'
                           }, Body: {
                               Text: { Data: 'You can check your watch here : http://' + config.host + '/search/' + searches[i]._id}
                            }
                       }
                    }, function(err, data) {
                        if(err)
                          console.log(err)
                        else
                        {
                          console.log("\t\tUser mailed")
                        }
                     })
                  }
                  console.log("Match on [" + searches[i].title + '] - [' + post.title + '] - [' + post._id + ']')
                  searches[i].parsePost(post, req.app.io);
                }
                i++;
                setTimeout(iter, 1)
              }
            }
            iter();
          }) // Search.find

        })
      } // done
    }) // jsdom
  }
}

/**
 * Statics
 */

PostSchema.statics = {

  /**
   * Find article by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  getLastXTitle: function (cb) {
    this.find({}, 'title -_id')
      .sort({'createdAt': -1}) // sort by date
      .limit(config.crawl.nb_per_page)
      .exec(cb)
  },

  /**
   * List articles
   *
   * @param {Object} options
   * @param {Function} cb
   * @api private
   */

  list: function (options, cb) {
    var criteria = options.criteria || {}

    this.find(criteria)
      .sort({'createdAt': -1}) // sort by date
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(cb)
  }


}

mongoose.model('Post', PostSchema)
