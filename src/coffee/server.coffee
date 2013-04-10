net = require 'net'

# configurable options
options =
  transport: 'websocket' # use xhr-polling if the connection doesn't work
  webPort: 2280 # HTTP port for the web socket
  tcpPort: 4100 # local TCP port for the bridge

io = (require 'socket.io').listen options.webPort,
  transports: [ options.transport ]
  'log level': 1

io.sockets.on 'connection', (socket) ->

  console.warn 'socket: ' + socket.transport

  server = net.createServer()

  server.listen options.tcpPort, ->
    console.log 'ds server proxy listening'

  connections = {}

  socket.on 'data', (data) ->
    bridge = connections[data.key]
    if bridge
      bridge.write new Buffer data.buffer
    else
      console.log 'invalid key: ' + data.key

  key = 0
  server.on 'connection', (bridge) ->
    thisKey = key++
    connections[thisKey] = bridge

    console.log 'ds client connected: ' + thisKey
    socket.emit 'bridge-connect', key: thisKey

    bridge.on 'data', (data) ->
      socket.emit 'data', key: thisKey, buffer: data

    bridge.on 'end', ->
      console.log 'bridge end: ' + thisKey
      socket.emit 'bridge-disconnect', key: thisKey
      delete connections[thisKey]
