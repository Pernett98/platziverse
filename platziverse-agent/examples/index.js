const PlatziverseAgent = require('../')

const agent = new PlatziverseAgent({
  name: 'myapp',
  username: 'platzi',
  interval: 2000
})

agent.addMetric('rss', function getRss () {
  return process.memoryUsage().rss
})

agent.addMetric('promiseMetric', function getRadmonPromise () {
  return Promise.resolve(Math.random())
})

agent.addMetric('callbacMetric', function getRadmonCallback (callback) {
  setTimeout(() => {
    callback(null, Math.random())
  }, 1000)
})

agent.connect()

// This agent only
agent.on('connected', handler)
agent.on('disconnected', handler)
agent.on('message', handler)

// Public events
agent.on('agent/connected', handler)
agent.on('agent/connected', handler)
agent.on('agent/message', payload => {
  console.log(payload)
})

function handler (payload) {
  console.log(payload)
}

setTimeout(() => agent.disconnect(), 20000)