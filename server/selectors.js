export function socketInfo(state) {
  let keys = Object.keys(state.sockets)
  console.warn(keys)
  return keys
}

export function uiState(state) {
  return {
    sockets: socketInfo(state)
  }
}
