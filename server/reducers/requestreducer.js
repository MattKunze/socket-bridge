import { omit } from 'lodash'

import { Actions } from '../constants'

export default function (state = {}, action) {
  let id, current
  switch(action.type) {
    case Actions.HTTP_BRIDGE_REQUEST:
      id = action.payload.id
      return Object.assign({}, state, {
        [id]: Object.assign({
          _res: action.payload.res,
          start: Date.now(),
          received: 0,
          bodyLength: action.payload.body ? action.payload.body.length : null
        }, omit(action.payload, 'id', 'res', 'body'))
      })
      break
    case Actions.HTTP_BRIDGE_REQUEST_CANCEL:
      id = action.payload.id
      return omit(state, id)
    case Actions.HTTP_BRIDGE_RESPONSE_HEADERS:
      id = action.payload.id
      current = state[id]
      return Object.assign({}, state, {
        [id]: Object.assign({}, current, {
          status: action.payload.statusCode
        })
      })
    case Actions.HTTP_BRIDGE_RESPONSE_DATA:
      id = action.payload.id
      current = state[id]
      return Object.assign({}, state, {
        [id]: Object.assign({}, current, {
          received: current.received + action.payload.chunk.length
        })
      })
    case Actions.HTTP_BRIDGE_RESPONSE_ERROR:
      id = action.payload.id
      current = state[id]
      return Object.assign({}, state, {
        [id]: Object.assign({}, current, {
          statusCode: 500,
          error: action.payload.error,
          elapsed: Date.now() - current.start
        })
      })
    case Actions.HTTP_BRIDGE_RESPONSE_END:
      id = action.payload.id
      current = state[id]
      return Object.assign({}, state, {
        [id]: Object.assign({}, current, {
          elapsed: Date.now() - current.start
        })
      })
    default:
      return state;
  }
}
