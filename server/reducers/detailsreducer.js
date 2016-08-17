import { Actions } from '../constants'

const initialState = () => {
  return {
    basePort: 0
  }
}

export default function(state = initialState(), action) {
  switch(action.type) {
    case Actions.SERVER_LISTENING:
      return Object.assign({}, state, {
        basePort: action.payload.basePort
      })
    default:
      return state
  }
}
