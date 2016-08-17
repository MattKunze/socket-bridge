var path = require('path')

var express = require('express')
var bodyParser = require('body-parser')
var http = require('http')
var https = require('spdy')
var socketIo = require('socket.io')
var LEX = require('letsencrypt-express')

import { Actions } from './constants'
import createStore from './createStore'
var middleware = require('./middleware')

module.exports = (args) => {
  const basePort = args.basePort || 5000

  const app = express()

  const store = createStore()
  middleware(app, store)

  if(args.noHttps) {
    // running into webpack issues requiring socket.io, express, etc elsewhere
    // in the app, so dispatching the reference here seems to be the easiest
    // workaround
    var server = http.Server(app)
    store.dispatch({
      type: Actions.SERVER_LISTENING,
      payload: { express, bodyParser, socketIo, server, basePort }
    })

    var listenPort = args.listenPort || 3000
    server.listen(listenPort, (error) => {
      if(error) {
        console.error('Failed to start server', error)
      }
      else {
        console.log(`Listening at http://localhost:${listenPort}`)
      }
    })
  }
  else {
    const lex = LEX.create({
      configDir: path.join(require('os').homedir(), 'letsencrypt', 'etc'),
      approveRegistration: (hostname, approve) => {
        if(hostname === args.lexDomain) {
          approve(null, {
            domains: [ args.lexDomain ],
            email: args.lexEmail,
            agreeTos: true
          })
        }
      }
    })

    const redirectHttp = () => {
      http.createServer(LEX.createAcmeResponder(lex, (req, res) => {
        // not using express so helper functions aren't available
        res.setHeader('Location', `https://${req.headers.host + req.url}`)
        res.statusCode = 302
        res.end('Redirecting to https://')
      })).listen(80)
    }

    const serveHttps = () => {
      const server = https.createServer(lex.httpsOptions,
        LEX.createAcmeResponder(lex, app))
      store.dispatch({
        type: Actions.SERVER_LISTENING,
        payload: { socketIo, server, basePort }
      })
      server.listen(443, (error) => {
        if(error) {
          console.error('Failed to start server', error)
        }
        else {
          console.log(`Listening at https://${args.lexDomain}`)
        }
      })
    }

    redirectHttp()
    serveHttps()
  }
}
