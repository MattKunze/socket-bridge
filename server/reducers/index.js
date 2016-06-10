import { combineReducers } from 'redux'

const placeholder = (state = { fake: 'stuff' }, action) => {
  return state
}

export default () => {
  return combineReducers({
    placeholder
  })
}
