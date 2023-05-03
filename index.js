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
    const header = req.headers

    // ! Handling Payload
    const decoder = new stringDecoder('utf-8')
    let buffer = ''
    req.on('data', (chunk) => {
        buffer += decoder.write(chunk)
    })

    req.on('end', () => {
        buffer += decoder.end()

        res.end('Hello, World!\n')
        console.log(path, method, parsedUrl, queryParams, header, buffer)
    })
}) 

// *** Listening to server at port :3000
server.listen(3000, () => {
    console.log(`Listening http://localhost:3000`)
})