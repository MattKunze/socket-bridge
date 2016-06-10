import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'

import createStore from './createstore'
import Root from './ui/root'

if(module.hot) {
  module.hot.accept()
}

const store = createStore(window.__INITIAL_STATE__)

render(
  <Provider store={store}>
    <Root />
  </Provider>,
  document.querySelector('#root')
)
