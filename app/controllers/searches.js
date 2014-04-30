
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Search = mongoose.model('Search')
  , utils = require('../../lib/utils')
  , elapsed_time = utils.elapsed_time

/**
 * Load
 */

exports.load = function(req, res, next, id) {
  //req.start = process.hrtime();

  if (!req.user)
    return res.json({success: false, message: '403 : access denied'})
  //elapsed_time(req.start, "begin loadpopulate()");
  Search.loadPopulate(req.params.searchId, function (err, search) {
    //elapsed_time(req.start, "result loadpopulate()");
    if (err)
      return next(err)
    if (search.user._id.toString() != req.user._id)
      res.json({success: false, message: '403 : access denied'})
    else
    {
      //elapsed_time(req.start, "next loadpopulate()");
      req.search = search
      next()
    } 
  })
}


exports.loadPost = function(req, res, next, id_post){
  Search.getPost(req.search._id, id_post, function (err, post) {
    if (err) return next(err)
    if (!post) return next(new Error('not found'))
    req.post = post
    next()
  })
}



/**
 * List 
 */
exports.getList = function(req, res) {
  if (!req.user)
    return res.json({success: false, message: '403 : access denied'})

  // We don't use pagination here, but I dont remove it, as reminder
  var page = (req.param('page') > 0 ? req.param('page') : 1) - 1
  var perPage = 30000
  var options = {
    perPage: perPage,
    page: page,
    criteria: {user: req.user._id}
  }
  
  Search.list(options, function(err, searches) {
    if (err)
      res.json({success: false, message:'No such search'})
    res.json({success: true, list: searches})
  })  
}

exports.getDetail = function(req, res) {
  //elapsed_time(req.start, "getDetail()");
  if (req.search)
    res.json({success: true, search: req.search})
  else 
    res.json({success: false, message:'Search not found'})
}

exports.getPost = function(req, res) {
  if (req.search != null && req.post != null)
    res.json({success:true, post: req.post, is_read: req.search.posts_read.indexOf(req.post._id) != -1})
  else
    res.json({success: false, message:'Post not found'})
}


/**
 * API PUT/POST/DELETE
 */
exports.create = function (req, res) {

  var search = new Search(req.body.search)
  search.user = req.user
  search.regex = Search.getRegexFromFilter(search.filter)

  search.save(function (err, search2) {
    if (!err) {
      res.json({ success: true, search: search })
      mongoose.model('Post').find({body: new RegExp(search.regex, 'i') }).exec(function(err, posts) {
        var i = 0;
        function iter() {
          if (i < posts.length) {
            search.parsePost(posts[i], req.app.io);
            i++;
            setTimeout(iter, 1)
          }
        }
        iter();
      });
      search.sendToSocket(req.app.io, 'create', req.body.socketId);
    }
    else
      res.json({ success: false, message:utils.errors(err.errors || err) })
  })
}
exports.update = function(req, res) {
  if (req.body.pushPostRead != undefined)
  {
    if (req.search.posts_read.indexOf(req.body.pushPostRead) == -1)
    {
      req.search.posts_read.push(req.body.pushPostRead)
      req.search.save(function(err) {
        if (err)
          res.json({ success: false, message:utils.errors(err.errors || err) })
        else
        {
          req.search.sendToSocket(req.app.io, 'update', req.body.socketId);
          res.json({ success: true })
        }
      })
    }
    else
      res.json({ success: true })
  }
  else if (req.body.pushPostFav != undefined)
  {
    if (req.search.posts_favorite.indexOf(req.body.pushPostFav) == -1)
    {
      req.search.posts_favorite.push(req.body.pushPostFav)
      req.search.save(function(err) {
        if (err)
          res.json({ success: false, message:utils.errors(err.errors || err) })
        else
        {
          req.search.sendToSocket(req.app.io, 'update', req.body.socketId);
          res.json({ success: true })
        }
      })
    }
    else
      res.json({ success: true })
  }
  else if (req.body.pullPostFav != undefined)
  {
    if (req.search.posts_favorite.indexOf(req.body.pullPostFav) != -1)
    {
      req.search.posts_favorite.splice(req.search.posts_favorite.indexOf(req.body.pullPostFav), 1)
      req.search.save(function(err) {
        if (err)
          res.json({ success: false, message:utils.errors(err.errors || err) })
        else
        {
          req.search.sendToSocket(req.app.io, 'update', req.body.socketId);
          res.json({ success: true })
        }
      })
    }
    else
      res.json({ success: true })
  }
  else if (req.body.allRead != undefined)
  {
    for (var i = 0; i < req.search.posts.length; i++)
    {
      if (req.search.posts_read.indexOf(req.search.posts[i]._id) == -1)
        req.search.posts_read.push(req.search.posts[i]._id)
    }

    req.search.save(function(err) {
      if (err)
        res.json({ success: false, message:utils.errors(err.errors || err) })
      else
      {
        req.search.sendToSocket(req.app.io, 'update', req.body.socketId);
        res.json({ success: true })
      }
    })
  }
  else
  {
    // Whitelist security check (can't edit userId)

    var last_filter = req.search.filter
    for (i in req.body.search)
      if (['favorite','filter','title','test_regex', 'is_alerted', 'email_alert'].indexOf(i) != -1)
      {
        req.search[i] = req.body.search[i]
      }
      req.search['last_alerted'] = new Date()

    req.search.regex = Search.getRegexFromFilter(req.search.filter)
    
    req.search.save(function(err) {
      if (err)
        res.json({ success: false, message:utils.errors(err.errors || err) })
      else
      {
        req.search.sendToSocket(req.app.io, 'update', req.body.socketId);
        res.json({ success: true, message : 'Data updated successfully' })

        if (last_filter != req.search.filter)
        {
          mongoose.model('Post').find({body: new RegExp(req.search.regex, 'i') }, function(err, posts) {
            var i = 0;
            function iter() {
              if (i < posts.length) {
                req.search.parsePost(posts[i], req.app.io);
                i++;
                setTimeout(iter, 1)
              }
            }
            iter();
          });
        }
      }
    })
  }
}

exports.delete = function(req, res){
  req.search.sendToSocket(req.app.io, 'delete', req.body.socketId);
  req.search.remove(function(err){
    if (err)
      res.send(JSON.stringify({success: false, message: utils.errors(err.errors || err) }))
    else
      res.send(JSON.stringify({success: true }))
  })
}