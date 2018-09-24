'use strict'

const debug = require('debug')('platziverse:web')
const chalk = require('chalk')
const http = require('http')
const path = require('path')
const express = require('express')
const asyncify = require('express-asyncify');
const socketio = require('socket.io')
const PlatziverseAgent = require('platziverse-agent')
const { pipe } = require('platziverse-utils')
const proxy = require('./proxy')

if (process.env.NODE_ENV !== "production") {
  require('longjohn')
}

const port = process.env.PORT || 8080
const app = asyncify(express())
const server = http.createServer(app)
const io = socketio(server)
const agent = new PlatziverseAgent()

app.use(express.static(path.join(__dirname, 'public')))
app.use('/', proxy)

// Express Error handler
app.use((err, req, res, next) => {
  debug(`${chalk.red('Error')}`)
  debug(err)
  let code = 500
  if (err && typeof err.code === 'number') {
    code = err.code
  }

  res.status(code).send({
    error: err.message
  })
})

// Socket.io / Web sockets

io.on('connect', socket => {
  debug(`Connected ${socket.id}`)
  pipe(agent, socket)
})

function handleFatalError(err) {
  console.error(`${chalk.red('[Fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}

process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)

server.listen(port, () => {
  console.log(`${chalk.green('[platziverse-web]')} server is listening on port ${port}`)
  agent.connect()
})
