'use strict'

const Debug = require('debug')
const express = require('express')
const asyncify = require('express-asyncify')
const db = require('platziverse-db')
const {
  configDB
} = require('platziverse-utils')
const {
  AgentNotFoundError,
  MetricsNotFoundError
} = require('./custom-errors')

const debug = Debug('platziverse:api:routes')
const debugDB = Debug('platziverse:api:db')

const config = configDB(debugDB, false)

const api = asyncify(express.Router())

let services, Agent, Metric

api.use('*', async (req, res, next) => {
  if (!services) {
    try {
      services = await db(config)
      Agent = services.Agent
      Metric = services.Metric
      debug('Connected to db')
    } catch (error) {
      return next(error)
    }
  }
  next()
})

api.get('/agents', async (req, res, next) => {
  debug('A request has come to /agents')

  let agents = []

  try {
    agents = await Agent.findConnected()
  } catch (error) {
    return next(error)
  }

  res.send(agents)
})

api.get('/agent/:uuid', async (req, res, next) => {
  const {
    uuid
  } = req.params
  debug(`A request has come to /agents/${uuid}`)

  let agent

  try {
    agent = await Agent.findByUuid(uuid)
  } catch (error) {
    return next(error)
  }

  if (!agent) {
    return next(new AgentNotFoundError(uuid))
  }

  res.send(agent)
})

api.get('/metrics/:uuid', async (req, res, next) => {
  const {
    uuid
  } = req.params
  debug(`A request has come to /metrics/${uuid}`)

  let metrics = []

  try {
    metrics = await Metric.findByAgentUuid(uuid)
  } catch (error) {
    next(error)
  }

  if (!metrics || metrics.length === 0) {
    return next(new MetricsNotFoundError(uuid))
  }

  res.send(metrics)
})

api.get('/metrics/:uuid/:type', async (req, res, next) => {
  const {
    uuid,
    type
  } = req.params
  debug(`A request has come to /metrics/${uuid}/${type}`)

  let metricsByType = []

  try {
    metricsByType = await Metric.findByTypeAgentUuid(type, uuid)
  } catch (error) {
    return next(error)
  }

  if (!metricsByType || metricsByType.length === 0) {
    return next(new MetricsNotFoundError(uuid, type))
  }

  res.send(metricsByType)
})

module.exports = api
