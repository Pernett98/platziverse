'use strict'

const debug = require('debug')('platziverse:mqtt')
const mosca = require('mosca')
const redis = require('redis')
const chalk = require('chalk')
const db = require('platziverse-db')
const { configDB, parsePayload } = require('platziverse-utils')

const backend = {
  type: 'redis',
  redis,
  return_buffers: true
}

const settings = {
  port: 1883,
  backend
}

const config = configDB(debug, false)

const server = new mosca.Server(settings)
const clients = new Map()

let Agent, Metric

server.on('clientConnected', client => {
  debug(`Client Connected: ${client.id}`)
  clients.set(client.id, null)
})

server.on('clientDisconnected', async client => {
  debug(`Client disconnected: ${client.id}`)
  const agent = clients.get(client.id)
  if (agent) {
    // Mark Agent as Disconnected
    agent.connected = false
    try {
      await Agent.createOrUpdate(agent)
    } catch (error) {
      return handleError(error)
    }
    // Delete Agent from Clients List
    clients.delete(client.id)

    server.publish({
      topic: 'agent/disconnected',
      payload: JSON.stringify({
        agent: {
          uuid: agent.uuid
        }
      })
    })
    debug(`Client (${client.id}) associated to Agent (${agent.uuid})`)
  }
})

server.on('published', async (packet, client) => {
  debug(`Received: ${packet.topic}`)

  switch (packet.topic) {
    case 'agent/connected':
    case 'agent/disconnected':
      debug(`Payload: ${packet.payload}`)
      break
    case 'agent/message':
      debug(`Payload: ${packet.payload}`)
      const payload = parsePayload(packet.payload)
      if (payload) {
        payload.agent.connected = true
        let agent
        try {
          agent = await Agent.createOrUpdate(payload.agent)
        } catch (error) {
          return handleError(error)
        }
        debug(`Agent ${agent.uuid} saved`)
        // Notify Agent is Connected
        if (!clients.get(client.id)) {
          clients.set(client.id, agent)
          debug(`${chalk.blue('[WTF]')} connected ${client.nextId}`)
          server.publish({
            topic: 'agent/connected',
            payload: JSON.stringify({
              uuid: agent.uuid,
              name: agent.name,
              hostname: agent.hostname,
              pid: agent.pid
            })
          })
        }
        // Store Metrics
        for (let metric of payload.metrics) {
          try {
            Metric.create(agent.uuid, metric)
            .then(m => debug(`Metrics ${m.id}, saved on agent ${agent.uuid}`))
          } catch (error) {
            return handleError(error)
          }
        }
      }
      break
  }
})

server.on('ready', async () => {
  const services = await db(config).catch(handleFatalError)
  Agent = services.Agent
  Metric = services.Metric
  console.log(`${chalk.green('[platziverse-mqtt]')} server is running`)
})

server.on('error', handleFatalError)

function handleFatalError (error) {
  handleError(error)
  process.exit(1)
}

function handleError (error) {
  console.error(`${chalk.red('[fatal error]')} ${error.message} `)
  console.error(error.stack)
}

process.on('uncaughtException', handleFatalError)
process.on('unhandledRejection', handleFatalError)
