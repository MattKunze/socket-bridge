io = require 'socket.io-client'
net = require 'net'

# configurable options
options =
  socketServer: 'http://localhost:2280' # URL for listener
  bridgeServer: '10.255.255.104' # local server address for bridge
  bridgePort: 4100 # local tcp port for bridge

client = io.connect options.socketServer

client.on 'connect', ->

  servers = {}

  client.on 'bridge-disconnect', (data) ->
    server = servers[data.key]
    if server
      console.log 'disconnect server: ' + data.key
      server.end()
    else
      console.log 'disconnect bad key: ' + data.key

  client.on 'data', (data) ->
    server = servers[data.key]
    if server
      server.write new Buffer data.buffer
    else
      console.log 'data bad key: ' + data.key

  client.on 'bridge-connect', (data) ->
    thisKey = data.key
    console.log 'establishing bridge connection: ' + thisKey

    server = net.connect options.bridgePort, options.bridgeServer, ->
      console.log 'socket bridge connected: ' + thisKey

      servers[thisKey] = server

      server.on 'data', (data) ->
        client.emit 'data', key: thisKey, buffer: data

      server.on 'end', ->
        console.log 'bridge end: ' + thisKey
        delete servers[thisKey]

      server.on 'error', ->
        console.log 'bridge error: ' + thisKey

