
{spawn, exec} = require 'child_process'

isWindows = process.platform is 'win32'
coffee = if isWindows then 'coffee.cmd' else 'coffee'

task 'build', 'Build the files', (opts) ->
  exec "#{coffee} -cw -o build src"

task 'server', 'Runs the server side of the bridge', (opts) ->
  console.log 'running server'
  runner = spawn coffee, ['src/server.coffee']
