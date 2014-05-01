
var path = require('path')
  , rootPath = path.normalize(__dirname + '/..')

module.exports = {
  development: {
    db: process.env.MONGOHQ_URL,
    redis_url: process.env.REDISTOGO_URL,
    root: rootPath,
    app: {
      name: 'Not on My Watch'
    },
    facebook: {
      clientID: process.env.FB_KEY,  // Facebook application ID (PassportJs)
      clientSecret: process.env.FB_SECRET,
      callbackURL: "http://" + process.env.HOST + "/auth/facebook/callback"
    },
    aws: {
      accessKeyId: process.env.AWS_KEY, // Amazon web service key (ses)
      secretAccessKey: process.env.AWS_SECRET,
      region: process.env.AWS_REGION
    },
    mail_from: process.env.MAIL_FROM,
    host: process.env.HOST,
    crawl : {
      url: process.env.CRAWL_URL,
      encoding: process.env.CRAWL_ENCODING,
      selector: process.env.CRAWL_SELECTOR,
      selector_title: process.env.CRAWL_SELECTOR_TITLE,
      selector_subtitle: process.env.CRAWL_SELECTOR_SUBTITLE, // optionnal
      selector_link: process.env.CRAWL_SELECTOR_LINK,
      selector_body: process.env.CRAWL_SELECTOR_BODY,
      nb_per_page:8 
    }
  },
  production: {
    db: process.env.MONGOHQ_URL,
    redis_url: process.env.REDISTOGO_URL,
    root: rootPath,
    app: {
      name: 'Not on My Watch'
    },
    facebook: {
      clientID: process.env.FB_KEY,  // Facebook application ID (PassportJs)
      clientSecret: process.env.FB_SECRET,
      callbackURL: "http://" + process.env.HOST + "/auth/facebook/callback"
    },
    aws: {
      accessKeyId: process.env.AWS_KEY, // Amazon web service key (ses)
      secretAccessKey: process.env.AWS_SECRET,
      region: process.env.AWS_REGION
    },
    mail_from: process.env.MAIL_FROM,
    host: process.env.HOST,
    crawl : {
      url: process.env.CRAWL_URL,
      encoding: process.env.CRAWL_ENCODING,
      selector: process.env.CRAWL_SELECTOR,
      selector_title: process.env.CRAWL_SELECTOR_TITLE,
      selector_subtitle: process.env.CRAWL_SELECTOR_SUBTITLE, // optionnal
      selector_link: process.env.CRAWL_SELECTOR_LINK,
      selector_body: process.env.CRAWL_SELECTOR_BODY,
      nb_per_page:8 
    }
  },
}
