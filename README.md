# Not on my watch

Open source web crawler built with Node.js, mongodb and angular
Live example here : [http://not-on-my-watch.herokuapp.com/](http://not-on-my-watch.herokuapp.com/), watching the Korben's website, a famous french blog

# Installation

Copy and edit the config file

    cp config/config-example.js config/config.js
    vim config/config.js

# Usage

    node server.js

# Cron

    */5 * * * * root wget -O /dev/null "http://host:3000/api/post/crawl"

# License

MIT [http://rem.mit-license.org](http://rem.mit-license.org)

# Thanks

This application is based on [Madhusudhan Srinivasa < madhums8@gmail.com >](https://github.com/madhums)' [Node Express Mongoose](https://github.com/madhums/node-express-mongoose) 
