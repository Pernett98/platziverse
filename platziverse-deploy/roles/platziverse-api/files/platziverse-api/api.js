'use strict'

const Debug = require('debug')
const express = require('express')
const asyncify = require('express-asyncify')
const db = require('platziverse-db')
const auth = require('express-jwt')
const guard = require('express-jwt-permissions')()
const {
  configDB,
  getAuthConfig
} = require('platziverse-utils')
const {
  ErrorWithHTTPError,
  AgentNotFoundError,
  MetricsNotFoundError
} = require('./custom-errors')

const debug = Debug('platziverse:api:routes')
const debugDB = Debug('platziverse:api:db')

const config = configDB(debugDB, false)

const api = asyncify(express.Router())

const authConfig = getAuthConfig()

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

api.get('/agents', auth(authConfig), async (req, res, next) => {
  debug('A request has come to /agents')
  const {
    user
  } = req

  if (!user || !user.username) {
    return new ErrorWithHTTPError(403, 'Not authorizedt')
  }

  let agents = []

  try {
    if (user.admin) {
      agents = await Agent.findConnected()
    } else {
      agents = await Agent.findByUsername(user.username)
    }
  } catch (error) {
    return next(error)
  }

  res.send(agents)
})

api.get('/agent/:uuid', auth(authConfig), guard.check(['metrics:read']), async (req, res, next) => {
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

api.get('/metrics/:uuid', auth(authConfig), guard.check(['metrics:read']), async (req, res, next) => {
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

api.get('/metrics/:uuid/:type', auth(authConfig), guard.check(['metrics:read']), async (req, res, next) => {
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
