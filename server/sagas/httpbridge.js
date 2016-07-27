// can't require this here for some reason that I need to sort out
// var express = require('express')
// var bodyParser = require('body-parser')
var uuid = require('uuid')
import { omit, pickBy } from 'lodash'

import { eventChannel, takeEvery } from 'redux-saga'
import { call, put, select, take } from 'redux-saga/effects'

import { Actions } from '../constants'
import { responseSelector, socketSelector } from '../selectors'

function* listen() {
  yield takeEvery(Actions.HTTP_BRIDGE_CREATED, function* (action) {
    yield call(createBridge, action.payload)
  })
}
export default listen

function* createBridge({ express, bodyParser, socketId, name }) {
  const socket = yield select(socketSelector, socketId)
  const { nextPort } = yield select(state => state.details)

  var app = express()
  app.use(bodyParser.raw({ type: '*/*', limit: '10mb' }))
  app.listen(nextPort)
  yield put({
    type: Actions.HTTP_BRIDGE_APP,
    payload: { name, app, listenPort: nextPort }
  })

  try {
    const chan = yield call(socketChannel, name, socket, app)
    while(true) {
      let action = yield take(chan)
      yield put(action)
      let requestId = action.payload.id
      let res = yield select(responseSelector, requestId)
      switch(action.type) {
        case Actions.HTTP_BRIDGE_REQUEST:
          socket.emit('request', omit(action.payload, 'bridgeName', 'res'))
          break
        case Actions.HTTP_BRIDGE_REQUEST_CANCEL:
          if(res) {
            socket.emit('cancel', { id: action.payload.id })
          }
          break
        case Actions.HTTP_BRIDGE_RESPONSE_HEADERS:
          if(res) {
            res.status(action.payload.statusCode)
            res.set(action.payload.headers)
          }
          break
        case Actions.HTTP_BRIDGE_RESPONSE_DATA:
          if(res) {
            res.write(action.payload.chunk)
          }
          break
        case Actions.HTTP_BRIDGE_RESPONSE_ERROR:
          if(res) {
            res.status(500).send(action.payload.error)
            res.end()
          }
          break
        case Actions.HTTP_BRIDGE_RESPONSE_END:
          if(res) {
            res.end()
          }
          break
      }
    }
  }
  finally {
    console.log(`${socket.id} finally`)
  }
}

function socketChannel(bridgeName, socket, app) {
  return eventChannel(emitter => {
    // add middleware to forward requests over the socket
    app.use( (req, res) => {
      const id = uuid.v4()
      emitter({
        type: Actions.HTTP_BRIDGE_REQUEST,
        payload: {
          id,
          bridgeName,
          res,
          method: req.method,
          headers: pickBy(req.headers, (value, key) => {
            return (key === 'cookie') || key.startsWith('x-')
          }),
          path: req.originalUrl,
          body: req.body
        }
      })

      res.on('close', () => {
        emitter({
          type: Actions.HTTP_BRIDGE_REQUEST_CANCEL,
          payload: { id }
        })
      })
    })

    const emit = (type, payload) => {
      emitter({ type, payload })
    }
    socket.on('response-headers', emit.bind(null, Actions.HTTP_BRIDGE_RESPONSE_HEADERS))
    socket.on('response-data', emit.bind(null, Actions.HTTP_BRIDGE_RESPONSE_DATA))
    socket.on('response-error', emit.bind(null, Actions.HTTP_BRIDGE_RESPONSE_ERROR))
    socket.on('response-end', emit.bind(null, Actions.HTTP_BRIDGE_RESPONSE_END))
  })
}
