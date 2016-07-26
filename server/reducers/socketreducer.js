import { omit } from 'lodash'
import { Actions } from '../constants'

const reducer = (state = {}, action) => {
  switch(action.type) {
    case Actions.SOCKET_CONNECTED:
      {
        const socket = action.payload
        return Object.assign({}, state,
          { [socket.id]: socket })
      }
    case Actions.SOCKET_DISCONNECTED:
      {
        const socket = action.payload
        return omit(state, socket.id)
      }
    default:
      return state
  }
}

export default reducer
