// *** Environments container
const container = {}

// ** Staging Environment Variables
container.staging = {
    'port': 3000,
    'env': 'staging',
    'secret': 'hashingsha256'
}

// ** Production Environment Variables
container.production = {
    'port': 3001,
    'env': 'production',
    'secret': 'hashingsha256'
}

// ! Determine the environments selected from the terminal
const selectedEnv = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV.toLowerCase() : ''

const envsToExport = typeof(container[selectedEnv]) === 'object' ? container[selectedEnv] : container.staging

module.exports = envsToExport