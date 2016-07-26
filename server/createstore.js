import { applyMiddleware, createStore } from 'redux'
import createSagaMiddleware from 'redux-saga'

import 'regenerator-runtime/runtime'

import reducers from './reducers'
import rootSaga from './sagas'

const loggerMiddleware = ({ dispatch }) => {
  return (next) => {
    return (action) => {
      let details = ''
      if(action.error) {
        details += '[error]'
      }
      if(action.meta) {
        details += JSON.stringify(action.meta)
      }
      console.info(`Dispatching ${action.type}${details}`)

      return next(action)
    }
  }
}

export default (initialState = {}) => {
  const sagaMiddleware = createSagaMiddleware()
  const store = createStore(reducers(), initialState,
    applyMiddleware(sagaMiddleware, loggerMiddleware))

  sagaMiddleware.run(rootSaga)

  return store
}
