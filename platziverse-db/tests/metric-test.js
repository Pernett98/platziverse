'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const metricFixtures = require('./fixtures/metric')
const agentFixtures = require('./fixtures/agent')

let config = {
  logging: () => {}
}

let db = null
let AgentStub = {
  hasMany: sinon.spy()
}
let MetricStub = null
let sandbox = null
let single = Object.assign({}, metricFixtures.metric)
let newMetric = {
  type: 'memory',
  value: 5000
}
let uuid = 'yyy-yyy-yyy'
let type = 'memory'
let uuidArgs = {
  where: {
    uuid
  }
}
let findAllByUuid = {
  attributes: ['type'],
  group: ['type'],
  include: [{
    attributes: [],
    model: AgentStub,
    where: {
      uuid
    }
  }],
  raw: true
}
let findAllByTypeAndByUuid = {
  attributes: ['id', 'type', 'value', 'createdAt'],
  where: {
    type
  },
  limit: 20,
  order: [['createdAt', 'DESC']],
  include: [{
    attributes: [],
    model: AgentStub,
    where: {
      uuid
    }
  }],
  raw: true
}

test.beforeEach(async () => {
  sandbox = sinon.createSandbox()
  
  MetricStub = {
    belongsTo: sandbox.spy()
  }

  // AgentModel findOne stub
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.byUuid(uuid)))

  // MetricModel findAll stub
  MetricStub.findAll = sandbox.stub()
  MetricStub.findAll.withArgs(findAllByUuid).returns(Promise.resolve(metricFixtures.metricTypes))
  MetricStub.findAll.withArgs(findAllByTypeAndByUuid).returns(Promise.resolve(metricFixtures.metrics))

  // MetricModel create stub
  MetricStub.create = sandbox.stub()
  MetricStub.create.withArgs(newMetric).returns(Promise.resolve({
    toJSON() { return newMetric }
  }))

  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })
  db = await setupDatabase(config)
})

test.afterEach(() => {
  sandbox && sandbox.restore()
})

test('Metric', t => {
  t.truthy(db.Metric, 'Metric service should exists')
})

test.serial('Setup', t => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Argument should be the Metric model')
  t.true(MetricStub.belongsTo.called, 'MetricStub.belongsTo was executed')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be the Agent model')
})

test.serial('Metric#findByAgentUuid', async t => {
  let metricT = await db.Metric.findByAgentUuid(uuid)

  t.true(MetricStub.findAll.called, 'MetricModel findAll has been called')
  t.true(MetricStub.findAll.calledOnce, 'MetricModel findAll has been called once')
  t.true(MetricStub.findAll.calledWith(findAllByUuid), 'MetricModel findAll has been called wit the right params')


  t.deepEqual(metricT, metricFixtures.metricTypes, 'should by be the same')
})

test.serial('Metric#findByTypeAgentUuid', async t => {
  let metrics = await db.Metric.findByTypeAgentUuid(type, uuid)

  t.true(MetricStub.findAll.called, 'MetricModel findAll has been called')
  t.true(MetricStub.findAll.calledOnce, 'MetricModel findAll has been called once')
  t.true(MetricStub.findAll.calledWith(findAllByTypeAndByUuid), 'MetricModel findAll has been called wit the right params')

  t.deepEqual(metrics, metricFixtures.metrics, 'should by be the same')
})

test.serial('Metric#create', async t => {
  let metric = await db.Metric.create(uuid, newMetric)

  t.true(AgentStub.findOne.called, 'AgentModel findOne has been called')
  t.true(AgentStub.findOne.calledOnce, 'AgentModel findOne has been called once')
  t.true(AgentStub.findOne.calledWith(uuidArgs), 'AgentModel findOne has been called wit the right params')

  t.true(MetricStub.create.called, 'MetricModel create has been called')
  t.true(MetricStub.create.calledOnce, 'MetricModel create has been called once')
  t.true(MetricStub.create.calledWith(newMetric), 'MetricModel create has been called wit the right params')
  
  t.deepEqual(metric, newMetric)
})