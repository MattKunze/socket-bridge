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
  socket.on('response-end', responseEnd.bind(null, socket))
  socket.on('response-error', responseError.bind(null, socket))
}

var createBridge = (socket, options) => {
  var listenPort = nextPort++
  console.warn(`${socketKey(socket)}: create bridge - port ${listenPort}`, options)

  var app = express()
  app.use(bodyParser.raw({ type: '*/*' }))
  app.use(redirectRequest.bind(null, socket))

  return app.listen(listenPort)
}

var redirectRequest = (socket, req, res) => {
  console.warn(`${socketKey(socket)}: request to ${req.originalUrl}`)
  var id = uuid.v4()
  pendingResponses[id] = { res: res }
  socket.emit('request', {
    id: id,
    method: req.method,
    headers: _.pickBy(req.headers, (value, key) => {
      return (key === 'cookie') || key.startsWith('x-')
    }),
    path: req.originalUrl,
    body: req.body
  })
}

var responseHeaders = (socket, response) => {
  console.warn(`${socketKey(socket)}: response headers ${response.id}`)
  var res = pendingResponses[response.id].res
  res.status(response.statusCode)
  res.set(response.headers)
}
var responseData = (socket, response) => {
  console.warn(`${socketKey(socket)}: response data ${response.id}`)
  var res = pendingResponses[response.id].res
  res.write(response.chunk)
}
var responseEnd = (socket, response) => {
  console.warn(`${socketKey(socket)}: response end ${response.id}`)
  var res = pendingResponses[response.id].res
  res.end()
  delete pendingResponses[response.id]
}
var responseError = (socket, response) => {
  console.warn(`${socketKey(socket)}: response error ${response.id}`)
  var res = pendingResponses[response.id].res
  res.status(500).send(response.error)
  // delete pendingResponses[response.id]
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
