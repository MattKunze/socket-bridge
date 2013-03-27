io = (require 'socket.io').listen 2280
net = require 'net'

io.sockets.on 'connection', (socket) ->

  server = net.createServer (dsClient) ->
    console.log 'ds client connected'
    socket.emit 'dsConnect'

    socket.on 'data', (data) ->
      console.log 'socket data: ' + data.length
      dsClient.write new Buffer data

    dsClient.on 'data', (data) ->
      console.log 'client data: ' + data.length
      socket.emit 'data', data

  server.listen 4100, ->
    console.log 'ds server proxy listening'

