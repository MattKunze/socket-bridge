import { combineReducers } from 'redux'

import socketReducer from './socketReducer'

export default () => {
  return combineReducers({
    sockets: socketReducer
  })
}
