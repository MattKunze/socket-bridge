import { combineReducers } from 'redux'

import bridgeReducer from './bridgereducer'
import detailsReducer from './detailsreducer'
import messagesReducer from './messagesreducer'
import requestReducer from './requestreducer'
import socketReducer from './socketreducer'

export default () => {
  return combineReducers({
    bridges: bridgeReducer,
    details: detailsReducer,
    messages: messagesReducer,
    requests: requestReducer,
    sockets: socketReducer
  })
}
