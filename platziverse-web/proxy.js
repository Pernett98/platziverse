'use strict'

const express = require('express')
const request = require('request-promise-native')
const asyncify = require('express-asyncify');
const {
  endpoint,
  apiToken
} = require('./config')

const api = asyncify(express.Router())

api.get('/agents', async (req, res, next) => {
  const options = {
    method: 'GET',
    url: `${endpoint}/api/agents`,
    headers: {
      'Authorization': `Bearer ${apiToken}`
    },
    json: true
  }
  let result
  try {
    result = await request(options)
    res.send(result)
  } catch (error) {
    return next(error)
  }
})
api.get('/agent/:uuid', async (req, res) => {
  const {
    uuid
  } = req.params
  const options = {
    method: 'GET',
    url: `${endpoint}/api/agent/${uuid}`,
    headers: {
      'Authorization': `Bearer ${apiToken}`
    },
    json: true
  }
  let result
  try {
    result = await request(options)
    res.send(result)
  } catch (error) {
    return next(error)
  }
})
api.get('/metrics/:uuid', async (req, res) => {
  const {
    uuid
  } = req.params
  const options = {
    method: 'GET',
    url: `${endpoint}/api/metrics/${uuid}`,
    headers: {
      'Authorization': `Bearer ${apiToken}`
    },
    json: true
  }
  let result
  try {
    result = await request(options)
    res.send(result)
  } catch (error) {
    return next(error)
  }
})
api.get('/metrics/:uuid/:type', async (req, res, next) => {
  const {
    uuid,
    type
  } = req.params
  console.log(`${endpoint}/api/metrics/${uuid}/${type}`)
  const options = {
    method: 'GET',
    url: `${endpoint}/api/metrics/${uuid}/${type}`,
    headers: {
      'Authorization': `Bearer ${apiToken}`
    },
    json: true
  }
  let result
  try {
    result = await request(options)
    res.send(result)
  } catch (error) {
    return next(error)
  }
})

module.exports = api