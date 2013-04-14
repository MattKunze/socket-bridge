_ = require 'underscore'

express = require 'express'
app = express()
server = (require 'http').createServer app

# use livereload middleware
#app.use (require 'grunt-contrib-livereload/lib/utils').livereloadSnippet

tunnels = []

# temp
tunnels.push
  attributes:
    id: 1
    address: '1.2.3.4'
    localPort: 4000
    remotePort: 4000

app.get '/api/tunnels', (req, res) ->
  res.send _.pluck tunnels, 'attributes'

history = []

# temp
history.push
  when: new Date
  what: 'Something happened'
  severity: 'success'

history.push
  when: new Date
  what: 'It broke'
  severity: 'error'

app.get '/api/history', (req, res) ->
  res.send history

exports = module.exports = server
exports.use = ->
  app.use.apply app, arguments

