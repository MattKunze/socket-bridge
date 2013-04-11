express = require 'express'
app = express()
server = (require 'http').createServer app

# use livereload middleware
app.use (require 'grunt-contrib-livereload/lib/utils').livereloadSnippet

app.get '/hello', (req, res) ->
  res.send response: 'nothing'

exports = module.exports = server
exports.use = ->
  app.use.apply app, arguments

