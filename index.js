// ** Node.js dependencies
const http = require('http')
const enVariables = require('./config')
const routesHandler = require('./controllers/index')

// ** Creating a server
const server = http.createServer(routesHandler) 


const PORT = enVariables.port
const environment = enVariables.env
// *** Listening to server at port :3000
server.listen(PORT, () => {
    console.log(`Listening http://localhost:${PORT}`)
    console.log(`In ${environment} mode`)
})