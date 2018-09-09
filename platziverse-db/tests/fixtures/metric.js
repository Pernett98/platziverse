'use strict'

const { extend } = require('./utils');

const metric = {
  type: 'memory',
  value: 5000
}

const metrics = [
  metric,
  extend(metric, { value: 855 }),
  extend(metric, { value: 8552 }),
  extend(metric, { value: 1024 })
]

const metricTypes = [
  {type: 'cpu'},
  {type: 'memory'},
  {type: 'disk'}
]


module.exports = {
  metric, 
  metrics,
  metricTypes
}