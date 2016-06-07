var _ = require('lodash')
var express = require('express')
var bodyParser = require('body-parser')
var uuid = require('uuid')

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
    bridge = createBridge(socket, options)
  })
  socket.on('response-headers', responseHeaders.bind(null, socket))
  socket.on('response-data', responseData.bind(null, socket))
  socket.on('response-error', responseError.bind(null, socket))
  socket.on('response-end', responseEnd.bind(null, socket))
}

var createBridge = (socket, options) => {
  var listenPort = nextPort++
  console.warn(`${socketKey(socket)}: create bridge - port ${listenPort}`, options)

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
  var listenPort = args.listenPort || 80
  var basePort = args.basePort || 5000
  nextPort = basePort

  var app = express()
  var server = require('http').Server(app)
  var io = require('socket.io')(server)

  app.get('/', (req, res) => {
    res.send('server')
  })

  io.on('connection', handleSocket)

  server.listen(listenPort, () => {
    console.log(`Listening on port ${listenPort}`)
  })
}
