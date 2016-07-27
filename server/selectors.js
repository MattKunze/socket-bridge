import { isObject, reduce } from 'lodash'

export function socketSelector(state, id) {
  if (state.sockets[id]) {
    return state.sockets[id]._socket
  }
}

export function responseSelector(state, id) {
  if (state.requests[id]) {
    return state.requests[id]._res
  }
}

// probably a smarter way to do this, but this strips internal keys (leading
// underscore) which store server-side values that shouldn't be serialized
export function uiState(state) {
  return reduce(state, (memo, value, key) => {
    if (key[0] !== '_') {
      if (isObject(value)) {
        memo[key] = uiState(value)
      }
      else {
        memo[key] = value
      }
    }
    return memo
  }, {})
}
