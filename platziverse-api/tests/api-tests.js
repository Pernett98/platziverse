'use strict'

const test = require('ava')
const util = require('util')
const request = require('supertest')

const sinon = require('sinon')
const proxyquire = require('proxyquire')

const platziverseTestUtils = require('platziverse-test-utils')
const { agentFixtures, metricFixtures } = platziverseTestUtils.fixtures

const { getAuthConfig } = require('platziverse-utils')
const authConfig = getAuthConfig()

const auth = require('../auth')
const sign = util.promisify(auth.sign)

let sandbox = null
let server = null
let dbStub = null
let token = null
let AgentStub = {}
let MetricStub = {}
const testUuid = 'yyy-yyy-yyy'
const badUuid = 's'
const testMetricType = 'memory'
const badMetricType = 'cpu'

test.beforeEach(async () => {
  sandbox = sandbox = sinon.createSandbox()

  AgentStub.findConnected = sandbox.stub()
  AgentStub.findConnected.returns(Promise.resolve(agentFixtures.connected))

  AgentStub.findByUuid = sandbox.stub()
  AgentStub.findByUuid.withArgs(testUuid).returns(Promise.resolve(agentFixtures.byUuid(testUuid)))
  AgentStub.findByUuid.withArgs(badUuid).returns(Promise.resolve(null))

  MetricStub.findByAgentUuid = sandbox.stub()
  MetricStub.findByAgentUuid.withArgs(testUuid).returns(Promise.resolve(metricFixtures.metricTypes))
  MetricStub.findByAgentUuid.withArgs(badUuid).returns(Promise.resolve(null))

  MetricStub.findByTypeAgentUuid = sandbox.stub()
  MetricStub.findByTypeAgentUuid.withArgs(testMetricType, testUuid).returns(Promise.resolve(metricFixtures.metrics))
  MetricStub.findByTypeAgentUuid.withArgs(badMetricType, badUuid).returns(Promise.resolve(null))

  dbStub = sandbox.stub()
  dbStub.returns(Promise.resolve({
    Agent: AgentStub,
    Metric: MetricStub
  }))

  token = await sign({ admin: true, username: 'platzi' }, authConfig.secret)

  const api = proxyquire('../api', {
    'platziverse-db': dbStub
  })

  server = proxyquire('../server', {
    './api': api
  })
})

test.afterEach(async () => {
  sandbox && sandbox.restore()
})

test.serial.cb('/api/agents', t => {
  request(server)
    .get('/api/agents')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      console.error(err)
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(agentFixtures.connected)
      t.deepEqual(body, expected, 'response body should be the expected')
      t.end()
    })
})

test.serial.cb('/api/agent/:uuid', t => {
  request(server)
    .get('/api/agent/' + testUuid)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(agentFixtures.byUuid(testUuid))
      t.deepEqual(body, expected, 'response body should be the expected')
      t.end()
    })
})

test.serial.cb('/api/agent/:uuid - not found', t => {
  request(server)
    .get('/api/agent/' + 's')
    .set('Authorization', `Bearer ${token}`)
    .expect(404)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.truthy(res.body, 'should return an error')
      let body = JSON.stringify(res.body)
      t.truthy(body.includes('not found'))
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid', t => {
  request(server)
    .get('/api/metrics/' + testUuid)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(metricFixtures.metricTypes)
      t.deepEqual(body, expected, 'response body should be the expected')
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid - not found', t => {
  request(server)
    .get('/api/metrics/' + badUuid)
    .set('Authorization', `Bearer ${token}`)
    .expect(404)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      t.truthy(body.includes('not found'), 'response body should be the expected')
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid/:type', t => {
  request(server)
    .get(`/api/metrics/${testUuid}/${testMetricType}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      let expected = JSON.stringify(metricFixtures.metrics)
      t.deepEqual(body, expected, 'response body should be the expected')
      t.end()
    })
})

test.serial.cb('/api/metrics/:uuid/:type - not found', t => {
  request(server)
    .get(`/api/metrics/${badUuid}/${badMetricType}`)
    .set('Authorization', `Bearer ${token}`)
    .expect(404)
    .expect('Content-Type', /json/)
    .end((err, res) => {
      t.falsy(err, 'should not return an error')
      let body = JSON.stringify(res.body)
      t.truthy(body.includes('not found'), 'response body should be the expected')
      t.end()
    })
})
