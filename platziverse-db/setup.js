'use strict'

const debug = require('debug')('platziverse:db:setup')
const inquirer = require('inquirer')
const chalk = require('chalk')
const db = require('./')

const prompt = inquirer.createPromptModule()

function askToUser() {
  const withoutConfirm = process.argv.find((flag) => {
    return flag === '-y' || flag === '--yes'
  });
  return !withoutConfirm;
}

async function setup () {
  if (askToUser()) {
    const answer = await prompt([
      {
        type: 'confirm',
        name: 'setup',
        message: 'This will destroy your database data, are you sure'
      }
    ])
  
    if (!answer.setup) {
      return console.log('Nothing happened :D')
    }
  }
  const config = {
    database: process.env.DB_NAME || 'platziverse',
    username: process.env.DB_USER || 'platzi',
    password: process.env.DB_PASS || 'platzi',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    setup: true,
    logging: debug
  }

  await db(config).catch(handleFatalError)
  console.log('success!')
  process.exit(0)
}

function handleFatalError (error) {
  console.error(`${chalk.red('[fatal error]')} ${error.message}`)
  console.error(error.stack)
  process.exit(1)
}

setup()
