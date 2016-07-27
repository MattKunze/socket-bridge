import { Actions } from '../constants'

const initialState = () => {
  return { basePort: 0, nextPort: 0 }
}

export default function(state = initialState(), action) {
  switch(action.type) {
    case Actions.SERVER_LISTENING:
      return Object.assign({}, state, {
        basePort: action.payload.basePort,
        nextPort: action.payload.basePort
      })
    case Actions.HTTP_BRIDGE_APP:
      const { listenPort } = action.payload
      return Object.assign({}, state, {
        nextPort: Math.max(listenPort + 1, state.nextPort)
      })
    default:
      return state
  }
}
