
/**
 * Module dependencies.
 */
var mongoose = require('mongoose')
  , env = process.env.NODE_ENV || 'development'
  , config = require('../../config/config')[env]
  , Schema = mongoose.Schema

/**
 * Article Schema
 */

var SearchSchema = new Schema({
  title: {type : String, default : '', trim : true},
  filter: {type : String, default : '', trim : true},
  test_regex: {type : String, default : '', trim : true},
  email_alert: {type : String, default : 'no', enum: ['yes', 'no']},
  user: {type : Schema.ObjectId, ref : 'User'},
  regex: {type : String, default : '', trim : true},
  posts: [{type : Schema.ObjectId, ref : 'Post'}],
  posts_favorite: [{type : Schema.ObjectId, ref : 'Post'}],
  posts_read: [{type : Schema.ObjectId, ref : 'Post'}],
  last_post_parse: {type : Date },
  is_alerted: {type : Boolean, default : true },
  last_alerted: {type : Date,  default : Date.now },
  favorite: {type : Number, default : 0 },
  createdAt  : {type : Date, default : Date.now}
})

/**
 * Validations
 */

SearchSchema.path('title').validate(function (title) {
  return title.length > 0
}, 'Search title cannot be blank')

SearchSchema.path('filter').validate(function (filter) {
  return filter.length > 0
}, 'Search filter cannot be blank')

/**
 * Pre-remove hook
 */

SearchSchema.pre('remove', function (next) {
  //var imager = new Imager(imagerConfig, 'S3')
  //var files = this.image.files

  // if there are files associated with the item, remove from the cloud too
  //imager.remove(files, function (err) {
  //  if (err) return next(err)
  //}, 'article')

  next()
})

/**
 * Methods
 */

SearchSchema.methods = {
  parsePost: function(post, io) {
    var search = this
    mongoose.model('Search').update({_id: search._id}, { $addToSet: {posts : post} }, function(err) {
      if (err)
        console.error('Update error 1')
      else
      {
        var post_without_body = post.toObject()
        post_without_body.body = undefined

        search.sendPostToSocket(io, 'new', post_without_body)
        mongoose.model('Search').update({_id: search._id, last_post_parse: {$lt: post.createdAt}}, { $set: {last_post_parse : post.createdAt} }, function(err) {
         if (err)
           console.error('Update error 2 : ', err)
        })
      }
    })
  },
  sendToSocket: function (io, action, currentId) {
    var clients = io.sockets.clients()
    for (i in clients) 
    {
      if (clients[i].id == currentId)
        continue ;
      if (clients[i].handshake.session.passport.user == this.user || clients[i].handshake.session.passport.user == this.user._id)
      {
        clients[i].emit('search:' + action, this);
      }
    }
  },
  sendPostToSocket: function (io, action, post) {
    var clients = io.sockets.clients()
    for (i in clients) 
    {
      if (clients[i].handshake.session.passport.user == this.user || clients[i].handshake.session.passport.user == this.user._id)
      {
        clients[i].emit('post:' + action, {search: this, post: post});
      }
    }
  },
}

/**
 * Statics
 */

SearchSchema.statics = {

  /**
   * Find article by id
   *
   * @param {ObjectId} id
   * @param {Function} cb
   * @api private
   */

  loadPopulate: function (id, cb) {
    mongoose.model('Search').findOne({ _id : id})
      .populate('user')
      .populate({
        path: 'posts',
        select: 'title subtitle createdAt',
        options: {
          sort: {'createdAt': -1}
        }
      })
      .exec(function(error, search) {
        cb(error, search)
      })
  },

  load: function (id, cb) {
    mongoose.model('Search').findOne({ _id : id})
      .exec(function(error, search) {
        if (!search)
          return cb(error, search)
        mongoose.model('Search').findById(search._id, function(err, res) {
          if (err)
            throw err
          search.postLength = res.posts.length;

          cb(error, search)
        })
      })
  },

  getPost: function (id, id_post, cb) {

    this.findOne({ _id : id })
      .populate('user', 'email')
      
      /* Fonctionnel
      .populate({
        path: 'posts',
        select: 'body title createdAt',
        options: {
          match: { _id: mongoose.Types.ObjectId(id_post) },
        }
      })
      */

      // Optimisé
      .populate('posts', 'body title createdAt', {_id: id_post})
      .exec(function(error, search) {
        if (search.posts.length)
        {
          if (search.posts_read.indexOf(search.posts[0]._id) == -1)
          {
            search.posts_read.push(search.posts[0]._id)
            search.save()
          }
          cb(error, search.posts[0])
        }
        else
          cb(error, null)
      })
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
      .populate('user', 'email')
      .sort({'createdAt': -1}) // sort by date
      .limit(options.perPage)
      .skip(options.perPage * options.page)
      .exec(function(err, list) {
        cb(err, list)
      })
  },

  getRegexFromFilter: function (filter) {
    var regex = '';
    var prepare_regex = '(' + filter + ')'
    var regex_split = prepare_regex.split(/(\sET\s|\sOU\s|\sAND\s|\sOR\s|\(|\))/i)
    for (i in regex_split)
      if (!regex_split[i].match(/^\s*$/))
      {
        regex_split[i] = regex_split[i].replace(/^\s+|\s+$/g, "")
        if (regex_split[i].match(/^(ET|OU|AND|OR|\(|\))$/i))
        {
          regex_split[i] = regex_split[i].replace(/ET|AND/i, '')
          regex_split[i] = regex_split[i].replace(/OU|OR/i, '|')
        }
        else
        {
          regex_split[i] = regex_split[i].replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
          regex_split[i] = '(\\b' + regex_split[i] + '\\b)'
        }
        regex += regex_split[i]
      }


    return regex
  }

}

mongoose.model('Search', SearchSchema)
