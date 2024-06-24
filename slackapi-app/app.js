const { App } = require('@slack/bolt')
const config = require("dotenv").config().parsed

const token = config.SLACK_BOT_TOKEN || process.env.SLACK_BOT_TOKEN
const appToken = config.SLACK_APP_TOKEN || process.env.SLACK_APP_TOKEN

// Initializes the app with bot token and app token
const app = new App({
    /* receiver, */
    token,
    socketMode: true,
    appToken,
    /*customRoutes: [
      {
        path: '/health-check',
        method: ['GET'],
        handler: (req, res) => {
          console.log({ req, res })
          app.client.chat.postMessage({
            token: process.env.SLACK_BOT_TOKEN,
            channel: 'C03HN1SFFAL',
            text: 'Health check test'
          })
          res.writeHead(200);
          res.end('Health check information displayed here!');
        },
      },
      {
        path: '/api/v1/users',
        method: ['GET'],
        handler: (req, res) => {
          //console.log({ req, res })
          res.writeHead(200);
          //res.end('Health check information displayed here!');
          //res.json(users)
          res.end(JSON.stringify(users.map(e => e.name)))
        },
      },
    ],*/
  });

  module.exports = {
    app
  }