'use strict'

function configDB(debug, setup) {
  return {
    database: process.env.DB_NAME || 'platziverse',
    username: process.env.DB_USER || 'platzi',
    password: process.env.DB_PASS || 'platzi',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    setup,
    logging: m => debug(m),
  }
}

function parsePayload(payload) {
  if (payload instanceof Buffer) {
    payload = payload.toString('utf8')
  }
  try {
    payload = JSON.parse(payload)
  } catch (error) {
    payload = null
  }
  return payload
}

function getAuthConfig() {
  return {
    secret: process.env.SECRET || 'platzi'
  }
}

module.exports = {
  configDB,
  parsePayload,
  getAuthConfig
}