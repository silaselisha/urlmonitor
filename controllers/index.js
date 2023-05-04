const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder

const handlers = {}

handlers.sample = (data, cb) => {
    cb(406, {status: 'success', data: {name: 'sample hanlder'}})
}

handlers.notFound = (data, cb) => {
    cb(404)
}

const router = {
    'sample': handlers.sample
}

// *** ROUTES HANDLER
const routesHandler = (req, res) => {
    // ** sanitize the incomming request URL
    const parsedUrl = url.parse(req.url, true)
    const pathName = parsedUrl.pathname
    const path = pathName.replace(/^\/+|\/+$/g, '')

    // ** request method
    const method = req.method.toUpperCase()
    // ** request header
    const headers = req.headers
    // ** query params object
    const queryParams = parsedUrl.query
    
    
    // ** Handling incomming payload
    const decoder = new StringDecoder('utf-8')
    let buffer = ''

    req.on('data', (chunk) => {
        buffer += decoder.write(chunk)
    })

    req.on('end', () => {
        buffer += decoder.end()
        // ** choosen handler
        const choosenHandler = router[path] !== undefined ? router[path] : handlers.notFound

        // ** payload data
        const data = {
            headers,
            method,
            buffer,
            queryParams,
            'pathname': path
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
}

module.exports = routesHandler