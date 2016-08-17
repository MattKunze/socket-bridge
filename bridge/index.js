var _ = require('lodash')
var http = require('http')
var https = require('https')
var readline = require('readline')
var url = require('url')
var io = require('socket.io-client')

var targetAddress = null
var agent = null

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
    agent: agent,
    rejectUnauthorized: false
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
  var remoteAddress = args.remote || 'http://localhost:3000'
  var socket = io(remoteAddress)

  if(args.target) {
    socket.emit('bridge', {
      name: args.name || 'Unnamed bridge',
      target: args.target
    })

    targetAddress = url.parse(args.target)
    if (targetAddress.protocol === 'http:') {
      agent = new http.Agent({ keepAlive: true })
    }
    else {
      agent = new https.Agent({ keepAlive: true })
    }
    socket.on('request', forwardRequest.bind(null, socket))
    socket.on('cancel', cancelRequest)
    socket.on('disconnect', () => {
      console.warn('Disconnected...')
    })
    socket.on('reconnect', () => {
      console.warn('Reconnected')
      socket.emit('bridge', {
        name: args.name || 'Unnamed bridge',
        target: args.target
      })
    })
  }
  else if(args.send) {
    let getMessage = null;
    if(typeof args.send !== 'string') {
      getMessage = new Promise( (resolve, reject) => {
        const io = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        })
        let buffer = []
        io.write('Enter message to send: ')
        io.on('line', (line) => {
          if(line) {
            buffer.push(line)
          }
          else {
            io.close()
          }
        })
        io.on('close', () => resolve(buffer.join('\n')) )
      })
    }
    else {
      getMessage = Promise.resolve(args.send)
    }

    getMessage.then( (message) => {
      socket.emit('send', message)
      socket.on('ack', () => socket.close() )
    })
  }
}
