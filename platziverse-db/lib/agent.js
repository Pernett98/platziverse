'use strict'

module.exports = function setupAgent (AgentModel) {

  async function createOrUpdate(agent) {
    const cond = {
      where: {
        uuid: agent.uuid
      }
    }

    const existingAgent = await AgentModel.findOne(cond)
    if (existingAgent) {
      const updated = await AgentModel.update(agent, cond)
      return updated ? AgentModel.findOne(cond) : existingAgent;
    } 
    
    const result = await AgentModel.create(agent)
    return result.toJSON()
  }

  function findAll() {
    return AgentModel.findAll()
  }

  function findConnected() {
    const cond = {
      where: {
        connected: true
      }
    }
    return AgentModel.findAll(cond)
  }

  function findByUsername(username) {
    const cond = {
      where: {
        username,
        connected: true
      }
    }
    return AgentModel.findAll(cond)
  }

  function findById (id) {
    return AgentModel.findById(id)
  }

  function findByUuid(uuid) {
    const cond = {
      where: {
        uuid
      }
    }

    return AgentModel.findOne(cond)
  }

  return {
    findById,
    findByUuid,
    findAll,
    findByUsername,
    findConnected,
    createOrUpdate
  }
}
