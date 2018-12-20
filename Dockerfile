FROM node:9.11.2-alpine

RUN apk update && \
  apk add --no-cache \
  git \
  python3

RUN git clone --single-branch -b sagas https://github.com/MattKunze/socket-bridge

RUN cd socket-bridge && npm i
CMD cd socket-bridge && node index.js --server --listenPort=8888 --noHttps
