'use strict'

function parsePayload (payload) {
  console.log('ji')
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

module.exports = {
  parsePayload
}
