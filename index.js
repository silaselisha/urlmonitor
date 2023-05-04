// ** Node.js dependencies
const http = require('http')
const url = require('url')
const stringDecoder = require('string_decoder').StringDecoder

// ** Creating a server
const server = http.createServer((req, res) => {
    // ** GET parsed URL
    const parsedUrl = url.parse(req.url, true)

    // ** GET path NAME
    const pathName = parsedUrl.pathname
    const path = pathName.replace(/^\/+|\/+$/g, '') // ! trimed path

    // ** Query Parameter
    const queryParams = parsedUrl.query

    // ** Retrieve HTTP Request Method
    const method = req.method.toUpperCase()

    // ** Retrieve HTTP Request Headers
    const headers = req.headers

    // ! Handling Payload
    const decoder = new stringDecoder('utf-8')
    let buffer = ''
    req.on('data', (chunk) => {
        buffer += decoder.write(chunk)
    })

    req.on('end', () => {
        buffer += decoder.end()
        const choosenHandler = router[path] !== undefined ? router[path] : handlers.notFound
        
        console.log(choosenHandler)
        const data = {
            headers,
            method,
            'pathname': path,
            buffer,
            queryParams
        }

        choosenHandler(data, (statusCode, payload) => {
            statusCode = typeof(statusCode) === 'number' ? statusCode : 200
            payload = typeof(payload) === 'object' ? payload : {}

            res.setHeader('Content-Type', 'application/json')
            res.writeHead(statusCode)
            res.end(JSON.stringify(payload))
            console.log(`statusCode: ${statusCode} & payload: ${payload}`)
        })

    })
}) 

// ** ROUTING HANDLERS
const handlers = {}

handlers.sample = function(data, cb) {
    cb(406, {status: 'success', data: {name: 'sample route'}})
}

handlers.notFound = function(data, cb) {
    cb(404)
}

const router = {
    'sample': handlers.sample
}

// *** Listening to server at port :3000
server.listen(3000, () => {
    console.log(`Listening http://localhost:3000`)
})