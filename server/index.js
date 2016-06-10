var _ = require('lodash')
var path = require('path')

var express = require('express')
var http = require('http')
var https = require('spdy')
var LEX = require('letsencrypt-express')
var bodyParser = require('body-parser')
var uuid = require('uuid')

import createStore from './createStore'
var middleware = require('./middleware')

var nextPort = 0
var pendingResponses = {}

var socketKey = (socket) => socket.id

var handleSocket = (socket) => {
  var key = socket.id
  console.log(`${socketKey(socket)}: connected`)

  socket.on('disconnect', () => {
    console.log(`${socketKey(socket)}: disconnected`)
    if(bridge) {
      bridge.close()
    }
  })
  socket.on('error', (error) => {
    console.error(`${socketKey(socket)}: error`, error)
  })

  var bridge = null
  socket.on('bridge', (options) => {
    var listenPort = nextPort++
    bridge = createBridge(socket, { listenPort })
  })
  socket.on('response-headers', responseHeaders.bind(null, socket))
  socket.on('response-data', responseData.bind(null, socket))
  socket.on('response-error', responseError.bind(null, socket))
  socket.on('response-end', responseEnd.bind(null, socket))
}

var createBridge = (socket, { listenPort }) => {
  console.warn(`${socketKey(socket)}: create bridge - port ${listenPort}`)

  var app = express()
  app.use(bodyParser.raw({ type: '*/*', limit: '10mb' }))
  app.use(redirectRequest.bind(null, socket))

  return app.listen(listenPort)
}

var redirectRequest = (socket, req, res) => {
  var id = uuid.v4()
  pendingResponses[id] = {
    res: res,
    path: req.originalUrl,
    start: Date.now(),
    received: 0
  }
  socket.emit('request', {
    id: id,
    method: req.method,
    headers: _.pickBy(req.headers, (value, key) => {
      return (key === 'cookie') || key.startsWith('x-')
    }),
    path: req.originalUrl,
    body: req.body
  })

  req.on('close', () => {
    if(pendingResponses[id]) {
      console.info(`${socketKey(socket)}: got close ${id}`)
      socket.emit('cancel', { id: id })
    }
  })
}

var responseHeaders = (socket, response) => {
  var pending = pendingResponses[response.id]
  pending.status = response.statusCode
  pending.res.status(response.statusCode)
  pending.res.set(response.headers)
}
var responseData = (socket, response) => {
  var pending = pendingResponses[response.id]
  if(pending) {
    pending.received += response.chunk.length
    pending.res.write(response.chunk)
  }
}
var responseError = (socket, response) => {
  var pending = pendingResponses[response.id]
  pending.res.status(500).send(response.error)
  pending.res.end()
  delete pendingResponses[response.id]

  console.error(`${socketKey(socket)}: error ${pending.path} (${_.keys(response.error)}) - in ${Date.now() - pending.start}ms`)
}
var responseEnd = (socket, response) => {
  var pending = pendingResponses[response.id]
  if(pending) {
    pending.res.end()
    delete pendingResponses[response.id]

    console.info(`${socketKey(socket)}: redirect ${pending.path} (${pending.status}) - ${pending.received}b in ${Date.now() - pending.start}ms`)
  }
}

module.exports = (args) => {
  const basePort = args.basePort || 5000
  nextPort = basePort

  const app = express()

  const store = createStore()
  middleware(app, store)

  const initializeSockets = (server) => {
    var io = require('socket.io')(server)
    io.on('connection', handleSocket)
  }

  if(args.noHttps) {
    var server = http.Server(app)
    initializeSockets(server)

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
      const server = https.createServer(lex.httpsOptions, LEX.createAcmeResponder(lex, app))
      initializeSockets(server)
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
