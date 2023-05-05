const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder
const _data = require('../lib/data')
const { hashPassword, unmarshal } = require('../utils/utils')

const handlers = {}

handlers.ping = (data, cb) => {
    cb(200, {status: 'success', data: {}})
}

handlers.notFound = (data, cb) => {
    cb(404)
}

handlers.users = (data, cb) => {
    const acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE']
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._users[data.method](data, cb)
    }else {
        cb(405, {})
    }
}

handlers._users = {}
handlers._users.POST = (data, cb) => {
    const firstName = (typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length >= 3) ? data.payload.firstName.trim() : false
    const lastName = (typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length >= 3) ? data.payload.lastName.trim() : false
    const password = (typeof(data.payload.password) == 'string' && data.payload.password.trim().length >= 8) ? data.payload.password.trim() : false
    const tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true ? true : false
    const phoneNumber = typeof (data.payload.phoneNumber) === 'string' && data.payload.phoneNumber.trim().match(/^\+?[0-9]\d{1,20}$/) ? data.payload.phoneNumber.trim() : false

    if(firstName && lastName && password && phoneNumber && tosAgreement) {
        _data.read('users', phoneNumber, (err, data) => {
            if(err) {
                const hashedPassword = hashPassword(password)
                if(hashPassword) {
                    const user = {
                        firstName,
                        lastName,
                        phoneNumber,
                        tosAgreement,
                        password: hashedPassword,
                    }

                    _data.create('users', phoneNumber, user, (err) => {
                        if(!err) {
                            cb(201, user)
                        }else {
                            cb(400, {error: 'Couldn\'t create a new user!'})
                        }
                    })
                }
            }else {
                cb(400, {error: 'The user already exist'})
            }
        })
    }else {
        cb(400, {error: "Provide valid users details!"})
    }
}

handlers._users.GET = (data, cb) => {
    if (typeof (data.queryParams.phoneNumber) === 'string' && data.queryParams.phoneNumber.trim().match(/^\+?[0-9]\d{1,20}$/)) {
        _data.read('users', data.queryParams.phoneNumber, (err, user) => {
            if(!err && user) {
                user = unmarshal(user)
                delete user["password"]
                cb(200, user)
            }else {
                cb(404, {error: 'Couldn\'t retrieve user\'s data!'})
            }
        })
    }else {
        cb(404, {error: 'User not found!'})
    }
}

handlers._users.PUT = (data, cb) => {
    if (typeof (data.queryParams.phoneNumber) === 'string' && data.queryParams.phoneNumber.trim().match(/^\+?[0-9]\d{1,20}$/)) {

        _data.read('users', data.queryParams.phoneNumber.trim(), (err, user) => {
            user = unmarshal(user)
            if(!err) {
                const firstName = (typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length >= 3) ? data.payload.firstName.trim() : false
                const lastName = (typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length >= 3) ? data.payload.lastName.trim() : false
                const password = (typeof (data.payload.password) == 'string' && data.payload.password.trim().length >= 8) ? data.payload.password.trim() : false

                if(firstName) {
                    user.firstName = firstName
                }

                if(lastName) {
                    user.lastName = lastName
                }

                if(password) {
                    user.password = hashPassword(password)
                }

                console.log(user)

                _data.update('users', data.queryParams.phoneNumber.trim(), user, (err) => {
                    if(!err) {
                        cb(201, {})
                    }else {
                        cb(400, {error: 'Couldn\'t update the user! ' + err})
                    }
                })
            }else {
                cb(404, {error: 'User not found!'})
            }
        })
    }
}

handlers._users.DELETE = (data, cb) => {
    if (typeof (data.queryParams.phoneNumber) === 'string' && data.queryParams.phoneNumber.trim().match(/^\+?[0-9]\d{1,20}$/)) {
        _data.read('users', data.queryParams.phoneNumber.trim(), (err, data) => {
            if(!err && data) {
                console.log(data)
                _data.delete('users', unmarshal(data).phoneNumber.trim(), (err) => {
                    if(!err) {
                        cb(204, {})
                    }else {
                        cb(400, {error: 'User not found!'})
                    }
                })
            }else {
                cb(400, {error: err})
            }
        })
    }else {
        cb(404, { error: 'User not found!' })
    }
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
            'payload': unmarshal(buffer),
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

const router = {
    'ping': handlers.ping,
    'users': handlers.users
}

module.exports = routesHandler