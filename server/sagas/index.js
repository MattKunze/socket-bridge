import { eventChannel, END } from 'redux-saga'
import { call, fork, put, take } from 'redux-saga/effects'

import { Actions } from '../constants'

function* rootSaga() {
  yield [
    fork(webSocketListener)
  ]
}

function* webSocketListener() {
  const action = yield take(Actions.SERVER_LISTENING)
  const { socketIo, server } = action.payload
  const chan = yield call(ioChannel, socketIo(server))
  while(true) {
    let socket = yield take(chan)
    yield(fork(socketHandler, socket))
  }
}

function ioChannel(io) {
  return eventChannel(emitter => {
    io.on('connection', emitter)

    // have to return an unsubscribe function, but not really anything to do
    return () => {}
  })
}

function* socketHandler(socket) {
  yield put({
    type: Actions.SOCKET_CONNECTED,
    payload: socket
  })

  try {
    const chan = yield call(socketChannel, socket)
    while(true) {
      let action = yield take(chan)
      yield put(action)
    }
  }
  finally {
    console.log(`${socket.id} finally`)
  }
}

function socketChannel(socket) {
  return eventChannel(emitter => {
    socket.on('disconnect', () => {
      emitter({
        type: Actions.SOCKET_DISCONNECTED,
        payload: socket
      })
      emitter(END)
    })
    socket.on('bridge', details => {
      emitter({
        type: Actions.HTTP_BRIDGE,
        payload: Object.assign({
          socketId: socket.id
        }, details)
      })
    })

    // have to return an unsubscribe function, but not really anything to do
    return () => {}
  })
}

export default rootSaga
