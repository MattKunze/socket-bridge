import React from 'react'
import { renderToString } from 'react-dom/server'
import { Provider } from 'react-redux'

import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import webpack from 'webpack'

import webpackConfig from './webpack.config'

import Root from './ui/root'

const layout = (body, initialState) => (`
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8"/>
    <title>Socket Bridge</title>
  </head>
  <body>
    <div id="root"><div>${body}</div></div>
    <script type="text/javascript" charset="utf-8">
      window.__INITIAL_STATE__ = ${JSON.stringify(initialState)};
    </script>
    <script src="/static/bundle.js"></script>
  </body>
  </html>
`)

const renderApp = (store, res, req) => {
  const ui = (
    <Provider store={store}>
      <Root />
    </Provider>
  )
  req.send(
    layout(renderToString(ui), store.getState())
  )
}

module.exports = (app, store) => {

  var compiler = webpack(webpackConfig)
  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: webpackConfig.output.publicPath
  }))
  app.use(webpackHotMiddleware(compiler))

  // hook up server-side app rendering
  app.use(renderApp.bind(null, store))
}
