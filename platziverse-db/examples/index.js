'use strict'

const db = require('../');

async function run () {
  const conf = {
    database: process.env.DB_NAME || 'platziverse',
    username: process.env.DB_USER || 'platzi',
    password: process.env.DB_PASS || 'platzi',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres'
  }

  const { Agent, Metric } = await db(conf).catch(handleFatalError)

  const agent = await Agent.createOrUpdate({
    uuid: 'yyy',
    name: 'test',
    username: 'she',
    hostname: 'aasd',
    pid: 2,
    connected: false
  }).catch(handleFatalError)

  console.log('---Agent---\n', agent)

  const agents = await Agent.findAll().catch(handleFatalError)

  console.log('---Agents---\n', agents)


  const metrics = await Metric.findByAgentUuid(agent.uuid).catch(handleFatalError)

  console.log('---Metric types---\n', metrics)

  const metric = await Metric.create(agent.uuid ,{
    type: 'memory',
    value: 300
  }).catch(handleFatalError)
  
  console.log('---Metric---\n', metric)

  const metricsTypes = await Metric.findByTypeAgentUuid('memory', agent.uuid).catch(handleFatalError)

  console.log('---Metrics---\n', metricsTypes)
}

function handleFatalError (err) {
  console.error(err.message)
  console.error(err.stack)
  process.exit(1)
}

run()