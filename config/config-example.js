
var path = require('path')
  , rootPath = path.normalize(__dirname + '/..')

module.exports = {
  development: {
    db: 'mongodb://localhost/not_on_my_watch',
    redis_url: 'redis://localhost:6379/',
    root: rootPath,
    app: {
      name: 'Not on My Watch'
    },
    facebook: {
      clientID: '',  // Facebook application ID (PassportJs)
      clientSecret: '',
      callbackURL: "http://localhost:3000/auth/facebook/callback"
    },
    aws: {
      accessKeyId: '', // Amazon web service key (ses)
      secretAccessKey: '',
      region: "eu-west-1"
    },
    mail_from:"root@localhost",
    host:'localhost:3000',
    crawl : {
      url:'http://korben.info/',
      selector:'div.post',
      selector_title:'h2 a',
      selector_subtitle:'', // optionnal
      selector_link:'h2 a',
      selector_body:'div.post-content',
      nb_per_page:8 
    }
  },
  production: {
    db: 'mongodb://localhost/' + process.env.DB_NAME,
    redis_url: process.env.REDISTOGO_URL,
    root: rootPath,
    app: {
      name: 'Nodejs Express Mongoose Demo'
    },
    facebook: {
      clientID: process.env.FB_KEY,
      clientSecret: process.env.FB_SECRET,
      callbackURL: "http://" + process.env.HOST + "/auth/facebook/callback"
    },
    aws: {
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
      region: process.env.AWS_REGION
    },
    mail_from:process.env.MAIL_FROM,
    host:process.env.HOST,
  },
}
