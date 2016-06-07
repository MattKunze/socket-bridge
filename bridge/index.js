var _ = require('lodash')
var http = require('http')
var url = require('url')
var io = require('socket.io-client')

var targetAddress = null
var agent = new http.Agent({ keepAlive: true })

var pendingRequests = {}

var forwardRequest = (socket, request) => {
  var id = request.id

  var headers = Object.assign({}, request.headers)

  var body = null
  if(!_.isEmpty(request.body)) {
    body = request.body
    headers['content-length'] = body.length
  }
  console.log(`${id} forward request - ${request.path}`)

  var options = {
    protocol: targetAddress.protocol,
    hostname: targetAddress.hostname,
    port: targetAddress.port,
    method: request.method || 'GET',
    headers: headers,
    path: request.path,
    agent: agent
  }
  var req = http.request(options, (res) => {
    socket.emit('response-headers', {
      id: id,
      statusCode: res.statusCode,
      headers: res.headers
    })
    console.log(`${id} response - ${request.path} - ${res.statusCode}`)
    res.on('data', (chunk) => {
      console.warn(`${id} data - ${request.path} - ${chunk.length} bytes`)
      socket.emit('response-data', { id: id, chunk: chunk })
    })
    res.on('end', () => {
      console.warn(`${id} end - ${request.path}`)
      socket.emit('response-end', { id: id })
      delete pendingRequests[id]
    })
  })
  pendingRequests[id] = req
  req.on('error', (error) => {
    console.error('error', error)
    socket.emit('response-error', { id: id, error, error })
    delete pendingRequests[id]
  })
  if(body) {
    req.write(body)
  }
  req.end()
}

var cancelRequest = (request) => {
  console.warn(`${request.id} cancel`)
  var req = pendingRequests[request.id]
  if(req) {
    req.abort()
  }
}

module.exports = (args) => {
  var serverAddress = args.address || 'http://localhost'
  targetAddress = url.parse(args.target)

  var socket = io(serverAddress)
  socket.emit('bridge', {
    name: 'test bridge'
  })

  socket.on('request', forwardRequest.bind(null, socket))
  socket.on('cancel', cancelRequest)
}
