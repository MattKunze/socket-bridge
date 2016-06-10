import { createStore } from 'redux'

import reducers from './reducers'

export default (initialState = {}) => {

  const store = createStore(reducers(), initialState)

  return store
}
