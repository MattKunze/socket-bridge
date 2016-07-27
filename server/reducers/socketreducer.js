import { omit } from 'lodash'
import { Actions } from '../constants'

const reducer = (state = {}, action) => {
  switch(action.type) {
    case Actions.SOCKET_CONNECTED:
      {
        const socket = action.payload
        return Object.assign({}, state, {
          [socket.id]: {
            remoteAddress: socket.conn.remoteAddress,
            transport: socket.conn.transport.constructor.name,
            connected: new Date(socket.handshake.issued).toISOString(),
            _socket: socket,
          }
        })
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
