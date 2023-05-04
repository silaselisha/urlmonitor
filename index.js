// ** Node.js dependencies
const path = require('path')
const fs = require('fs')
const http = require('http')
const https = require('https')
const enVariables = require('./config')
const routesHandler = require('./controllers/index')

// ** HTTPS options
const options = {
    key: fs.readFileSync(path.join(__dirname, 'https/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'https/cert.pem'))
}

const PORT = enVariables.port
const environment = enVariables.env

// *** Listening to server
if(environment === 'staging') {
    // ** Creating a server
    const httpServer = http.createServer(routesHandler) 
    
    httpServer.listen(PORT, () => {
        console.log(`Listening http://localhost:${PORT}`)
        console.log(`In ${environment} mode`)
    })
}

if(environment === 'production') {
    // ** Creating a server
    const httpsServer = https.createServer(options, routesHandler)

    httpsServer.listen(PORT, () => {
        console.log(`Listening http://localhost:${PORT}`)
        console.log(`In ${environment} mode`)
    })
}