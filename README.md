# Not on my watch

Open source web crawler built with Node.js, mongodb and angular

# Installation

Copy and edit the config file

    cp config/config-example.js config/config.js
    vim config/config.js

# Usage

    node server.js

# Cron

    */5 * * * * root wget -O /dev/null "http://host:3000/api/post/crawl"

