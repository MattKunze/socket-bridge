import { Actions } from '../constants'

export default function(state = [], action) {
  switch(action.type) {
    case Actions.HTTP_MESSAGE:
      return state.concat(action.payload)
    default:
      return state
  }
  return state
}
