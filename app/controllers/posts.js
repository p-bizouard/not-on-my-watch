
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Post = mongoose.model('Post')
  , utils = require('../../lib/utils')
  , jsdom = require("jsdom")
  , fs = require("fs")
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]


exports.crawl = function (req, res) {
  jsdom.env({
    encoding:config.crawl.encoding,
    url: config.crawl.url,
    scripts: ["http://code.jquery.com/jquery-1.11.0.min.js"],
    done: function (errors, window) {
      if (errors)
      {
        console.log(errors)
        return ;
      }
      var $ = window.$;

      // To empty the post database L
      // db.posts.remove({}); db.searches.update({}, {$set: {posts: []}}, {multi: true})

      Post.getLastXTitle(function(error, post_last_x_title) {
        if (error)
        {
          console.log(error)
          return
        }

        var last_x_title = []
        for (i in post_last_x_title)
          last_x_title.push(post_last_x_title[i].title)

        console.info('New crawl')

        var continue_crawl = true;

        $(config.crawl.selector).each(function() {
          var title = $(this).find(config.crawl.selector_title).text()
          var subtitle = (config.crawl.selector_subtitle && config.crawl.selector_subtitle != '' ? $(this).find(config.crawl.selector_subtitle).text() : '')
          var url = $(this).find(config.crawl.selector_link).attr('href')

          if (last_x_title.indexOf(title) != -1)
            continue_crawl = false;

          if (continue_crawl)
          {
            console.info("\tNew post : ", title)
            var post = new Post({
              title: title,
              subtitle:subtitle,
              url:url
            })
            post.save(function (err) {
              if (err)
              {
                console.log(err)
                return
              }  
              console.log('Post saved : ', post._id)
              setTimeout(function() {
                post.getPostBody(req, res, url)  
              }, 1)
            }) // post_save
          } // /if post_max_id
        }) // td-each
      }) // getLastId
    } // done
  }) // jsdom

  res.end()
}