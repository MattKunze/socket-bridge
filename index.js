require('babel-register')

var args = require('minimist')(process.argv.slice(2))
if (args.server) {
  require('./server')(args)
} else if (args.bridge) {
  require('./bridge')(args)
} else {
  console.error('Not sure what you want me to do...')
}
