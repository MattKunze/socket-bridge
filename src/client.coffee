io = require 'socket.io-client'
net = require 'net'

client = io.connect 'http://localhost:2280/'

client.on 'connect', ->

  client.on 'dsConnect', ->
    console.log 'establishing ds connection'

    dsServer = net.connect 4100, '10.211.55.3', ->
      console.log 'ds server connected'

      client.on 'data', (data) ->
        console.warn 'client data: ' + data.length
        dsServer.write new Buffer data

      dsServer.on 'data', (data) ->
        console.warn 'ds server data: ' + data.length
        client.emit 'data', data

      dsServer.on 'end', ->
        console.log 'ds server end'
