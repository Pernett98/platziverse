'use strict'

const http = require('http')
const express = require('express')
const asyncify = require('express-asyncify')
const chalk = require('chalk')
const port = process.env.PORT || 3000
const debug = require('debug')('platziverse:api')

if (process.env.NODE_ENV !== "production") {
  require('longjohn')
}

const api = require('./api')

const app = asyncify(express())
const server = http.createServer(app)

app.use('/api', api)

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

function handleFatalError (err) {
  console.error(`${chalk.red('[Fatal error]')} ${err.message}`)
  console.error(err.stack)
  process.exit(1)
}

if (!module.parent) {
  process.on('uncaughtException', handleFatalError)
  process.on('unhandledRejection', handleFatalError)

  server.listen(port, () => {
    console.log(`${chalk.green('[platziverse-api]')} server is listening on port ${port}`)
  })
}

module.exports = server
