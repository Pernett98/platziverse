'use strict'

const setupDatabase = require('./lib/db')
const setupAgent = require('./models/agent')
const setupMetric = require('./models/metric')

module.exports = async function (config) {
  const sequelize = setupDatabase(config)
  const AgentModel = setupAgent(config)
  const MetricModel = setupMetric(config)

  AgentModel.hasMany(MetricModel)
  MetricModel.belongsTo(AgentModel)

  await sequelize.authenticate()
  // await sequelize.sync()

  const Agent = {}
  const Metric = {}

  return {
    Agent,
    Metric
  }
}
