import { pick, reject } from 'lodash'

import { Actions } from '../constants'

export default function (state = {}, action) {
  switch(action.type) {
    case Actions.HTTP_BRIDGE_CREATED:
      return Object.assign({}, state, {
        [action.payload.name]: pick(action.payload, 'socketId', 'target')
      })
    case Actions.HTTP_BRIDGE_APP:
      const current = state[action.payload.name]
      return Object.assign({}, state, {
        [action.payload.name]: Object.assign({}, current, {
          listenPort: action.payload.listenPort,
          _app: action.payload.app,
        })
      })
    case Actions.SOCKET_DISCONNECTED:
      const socketId = action.payload.id
      return reject(state, test => {
        return test.socketId === socketId
      })
    default:
      return state
  }
}
