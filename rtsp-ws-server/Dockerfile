FROM node:10
WORKDIR /node-build
ADD package.json yarn.lock  ./
RUN yarn install

FROM node:10-alpine
WORKDIR /app
COPY --from=0 /node-build ./
COPY lib lib
COPY rtsp-ws-server rtsp-ws-server
CMD ["node", "/app/rtsp-ws-server/tcp-ws-proxy.js"]