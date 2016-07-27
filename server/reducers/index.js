import { combineReducers } from 'redux'

import bridgeReducer from './bridgereducer'
import detailsReducer from './detailsreducer'
import requestReducer from './requestreducer'
import socketReducer from './socketreducer'

export default () => {
  return combineReducers({
    bridges: bridgeReducer,
    details: detailsReducer,
    requests: requestReducer,
    sockets: socketReducer
  })
}
