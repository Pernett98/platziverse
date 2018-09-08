'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const agentFixtures = require('./fixtures/agent')

let config = {
  logging: () => {}
}

let MetricStub = {
  belongsTo: sinon.spy()
}

let id = 1
let single = Object.assign({}, agentFixtures.single)
let connectedArgs = { 
  where: { connected: true }
}
let usernameArgs = { 
  where: { username: 'platzi', connected: true }
}
let newAgent = {
  uuid: '123-123-123',
  name: 'test',
  username: 'test',
  hostname: 'test',
  pid: 0,
  connected: false
}
let db = null
let AgentStub = null
let sandbox = null
let uuid = 'yyy-yyy-yyy'
let uuidArgs = {
  where: {
    uuid
  }
}

test.beforeEach(async () => {
  sandbox = sinon.createSandbox()
  AgentStub = {
    hasMany: sandbox.spy()
  }

  // Model create stub
  AgentStub.create = sandbox.stub()
  AgentStub.create.withArgs(newAgent).returns(Promise.resolve({
    toJSON () { return newAgent }
  }))

  // Model findOne stub
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.byUuid(uuid)))

  //  Model findById stub 
  AgentStub.findById = sandbox.stub()
  AgentStub.findById.withArgs(id).returns(Promise.resolve(agentFixtures.byId(id)))

  // Model update stub
  AgentStub.update = sandbox.stub()
  AgentStub.update.withArgs(single, uuidArgs).returns(Promise.resolve(single))

  // Model find all stub
  AgentStub.findAll = sandbox.stub()
  AgentStub.findAll.withArgs().returns(Promise.resolve(agentFixtures.all))
  AgentStub.findAll.withArgs(connectedArgs).returns(Promise.resolve(agentFixtures.connected))
  AgentStub.findAll.withArgs(usernameArgs).returns(Promise.resolve(agentFixtures.platzi))


  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })
  db = await setupDatabase(config)
})

test.afterEach(() => {
  sandbox && sandbox.restore()
})

test('Agent', t => {
  t.truthy(db.Agent, 'Agent service should exists')
})

test.serial('Setup', t => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Argument should be the Metric model')
  t.true(MetricStub.belongsTo.called, 'MetricStub.belongsTo was executed')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be the Agent model')
})

test.serial('Agent#findAll', async t => {
  let agents = await db.Agent.findAll()

  t.true(AgentStub.findAll.called, 'Agent findConnected has been called')
  t.true(AgentStub.findAll.calledOnce, 'Agent findConnected has been called once')

  t.deepEqual(agents, agentFixtures.all, 'should by be the same')
})

test.serial('Agent#findById', async t => {
  let agent = await db.Agent.findById(id)

  t.true(AgentStub.findById.called, 'Agent find by id has been called')
  t.true(AgentStub.findById.calledOnce, 'Agent find by id has been called once')
  t.true(AgentStub.findById.calledWith(id), 'Agent find by id should be called with specified id')

  t.deepEqual(agent, agentFixtures.byId(id), 'should by be the same')
})

test.serial('Agent#findConnected', async t => {
  let agents = await db.Agent.findConnected()

  t.true(AgentStub.findAll.called, 'Agent findConnected has been called')
  t.true(AgentStub.findAll.calledOnce, 'Agent findConnected has been called once')
  t.true(AgentStub.findAll.calledWith(connectedArgs), 'Agent findConnected should be called with query')

  t.deepEqual(agents, agentFixtures.connected, 'should by be the same')
})

test.serial('Agent#findByUsername', async t => {
  let agents = await db.Agent.findByUsername('platzi')

  t.true(AgentStub.findAll.called, 'Agent findByUsername has been called')
  t.true(AgentStub.findAll.calledOnce, 'Agent findByUsername has been called once')
  t.true(AgentStub.findAll.calledWith(usernameArgs), 'Agent findByUsername should be called with query')

  t.deepEqual(agents, agentFixtures.platzi, 'should by be the same')
})

test.serial('Agent#createOrUpdate - exists', async t => {
  let agent = await db.Agent.createOrUpdate(single)

  t.true(AgentStub.findOne.called, 'findOne called')
  t.true(AgentStub.findOne.calledTwice, 'findOne called Twice')
  t.true(AgentStub.update.calledOnce, 'update called Once')

  t.deepEqual(agent, single, 'Agent should be the same')
})

test.serial('Agent#createOrUpdate - new', async t => {
  let agent = await db.Agent.createOrUpdate(newAgent)

  t.true(AgentStub.findOne.called, 'findOne called')
  t.true(AgentStub.findOne.calledOnce, 'findOne called Once')
  t.true(AgentStub.findOne.calledWith({
    where: { uuid: newAgent.uuid }
  }), 'findOne should be called with uuid args')
  t.true(AgentStub.create.called, 'create called')
  t.true(AgentStub.create.calledOnce, 'create called Once')
  t.true(AgentStub.create.calledWith(newAgent), 'crate should be called with newAgent')

  t.deepEqual(agent, newAgent, 'Agent should be the same')
})