const { Readable, Writable } = require('stream')
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder
const _data = require('../lib/data')
const { hashPassword, unmarshal, genereateTokenId } = require('../utils/utils')


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

handlers.tokens = (data, cb) => {
    const acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE']
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, cb)
    }else {
        cb(405, {})
    }
}

handlers.checks = (data, cb) => {
    const acceptableMethods = ['POST', 'GET', 'PUT', 'DELETE']
    if(acceptableMethods.indexOf(data.method) > -1) {
        handlers._checks[data.method](data, cb)
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
        handlers._tokens.auth(data.headers.token, data.queryParams.phoneNumber.trim(), (isTokenValid) => {
            
            if (isTokenValid) {
                _data.read('users', data.queryParams.phoneNumber, (err, user) => {
                    if (!err && user) {
                        user = unmarshal(user)
                        delete user["password"]
                        cb(200, user)
                    } else {
                        cb(404, { error: 'Couldn\'t retrieve user\'s data!' })
                    }
                })
            } else {
                cb(403, {
                    'status': 'fail', data: {
                        message: 'Unauthorized to access this resource!'
                    }
                })
            }
        })
    } else {
        cb(404, { error: 'User not found!' })
    }
}

handlers._users.PUT = (data, cb) => {
    if (typeof (data.queryParams.phoneNumber) === 'string' && data.queryParams.phoneNumber.trim().match(/^\+?[0-9]\d{1,20}$/)) {
        handlers._tokens.auth(data.headers.token, data.queryParams.phoneNumber.trim(), (isTokenValid) => {
            if(isTokenValid) {
                _data.read('users', data.queryParams.phoneNumber.trim(), (err, user) => {
                    user = unmarshal(user)
                    if (!err) {
                        const firstName = (typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length >= 3) ? data.payload.firstName.trim() : false
                        const lastName = (typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length >= 3) ? data.payload.lastName.trim() : false
                        const password = (typeof (data.payload.password) == 'string' && data.payload.password.trim().length >= 8) ? data.payload.password.trim() : false

                        if (firstName) {
                            user.firstName = firstName
                        }

                        if (lastName) {
                            user.lastName = lastName
                        }

                        if (password) {
                            user.password = hashPassword(password)
                        }

                        _data.update('users', data.queryParams.phoneNumber.trim(), user, (err) => {
                            if (!err) {
                                cb(201, {})
                            } else {
                                cb(400, { error: 'Couldn\'t update the user! ' + err })
                            }
                        })
                    } else {
                        cb(404, { error: 'User not found!' })
                    }
                })
            }else {
                cb(403, {
                    'status': 'fail', data: {
                        message: 'Unauthorized to access this resource!'
                    }
                }) 
            }
        })
  
    }
}

handlers._users.DELETE = (data, cb) => {
    handlers._tokens.auth(data.headers.token, data.queryParams.phoneNumber.trim(), (isTokenValid) => {
        if(isTokenValid) {
            if (typeof (data.queryParams.phoneNumber) === 'string' && data.queryParams.phoneNumber.trim().match(/^\+?[0-9]\d{1,20}$/)) {
                _data.read('users', data.queryParams.phoneNumber.trim(), (err, data) => {
                    if (!err && data) {
                        _data.delete('users', unmarshal(data).phoneNumber.trim(), (err) => {
                            if (!err) {
                                cb(204, {})
                            } else {
                                cb(400, { error: 'User not found!' })
                            }
                        })
                    } else {
                        cb(400, { error: err })
                    }
                })
            } else {
                cb(404, { error: 'User not found!' })
            }
        }else {
            cb(403, {
                'status': 'fail', data: {
                    message: 'Unauthorized to access this resource!'
                }
            }) 
        }
    })
}

/**
 * @TODO CRUD Operations & Token validation
 */
handlers._tokens = {}
handlers._tokens.POST = (data, cb) => {
    // ** Extract phone number & password
    // ** Check validity of the phone number & validiity of the password
    // ** Generate a token 
    const phone = typeof (data.payload.phoneNumber) === 'string' && data.payload.phoneNumber.trim().match(/^\+?[0-9]\d{1,20}$/) ?  data.payload.phoneNumber.trim() : false
    const password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length >= 8 ? data.payload.password.trim() : false

    if(phone && password) {
        _data.read('users', phone, (err, data) => {
            if(!err) {
                const user = JSON.parse(data)
                // ** check for password validity
                const isPasswordValid = hashPassword(password) === user.password ? true : false
               
                if(isPasswordValid) {
                    // ** generate token
                    // ** {tokenId, phone, expires}
                    const tokenId = genereateTokenId(12)
                    const expires = Date.now() * 60 * 60 * 1000
                    
                    const token = {
                        id: tokenId,
                        phone: phone,
                        expires: expires
                    }

                    // ** persit the data
                    _data.create('tokens', tokenId, token, (err) => {
                        if(!err) {
                            cb(201, {'status': 'success', 'data': {token}})
                        }else {
                            cb(500, {'Error': 'Token couldn\'t be created!'})
                        }
                    })
                }else {
                    cb(400, {'Error': 'Invalid user\'s credentials!'})
                }
            }else {
                cb(404, {'Error': 'User not found! Provide valid users credentilas.'})
            }
        })
    }else {
        cb(400, {'Error': 'Missing required fields'})
    }
}

handlers._tokens.GET = (data, cb) => {
    // ** Get token ID
    // ** Validate token id to exist
    const tokenId = typeof(data.queryParams.id) === 'string' && data.queryParams.id.trim() !== undefined ? data.queryParams.id.trim() : false

    if(tokenId) {
        _data.read('tokens', tokenId, (err, data) => {
            // ** validate token existance
            if(!err && data) {
                cb(200, {'status': 'success', data: {
                    token: JSON.parse(data)
                }})
            }else {
                cb(404, {'status': 'fail', data: {
                     message: 'Token not found!',
                     err: err
                }})
            }
        })
    }else {
        cb(400, {'status': 'fail', data: {
            message: 'Missing required filed(s)'
        }})
    }
}

handlers._tokens.PUT = (data, cb) => {
    // ** Get token ID
    // ** Get values to update: extend=true
    // ** extend the expires 1hour if extend=true && expires > Date.now()
    const tokenId = typeof(data.queryParams.id) === 'string' && data.queryParams.id.trim() !== undefined ? data.queryParams.id.trim() : false

    if(tokenId) {
        _data.read('tokens', tokenId, (err, token) => {
            token = unmarshal(token)
            if(!err && token) {
                // ** check for extend=true
                // ** check expires > Date.now()
                const extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend === true ? true : false
                const expires = token.expires > Date.now()

                if(extend && expires) {
                    const tokenExpires = Date.now() * 1000 * 60 * 60
                    token.expires = tokenExpires
                  
                    const parsedData = {
                        ...token //**had to do this since it was double parsing */
                    }
                    _data.update('tokens', tokenId, parsedData, (err) => {
                        if(!err) {
                            cb(200, {'status': 'success', data: {
                                token: 'updated successfully'
                            }})
                        }else {
                            cb(404, {'status': 'fail', data: {
                                message: 'Token not found!',
                                err: err
                            }})
                        }
                    })

                }else {
                    cb(400, {'status': 'fail', data: {
                        message: 'Couldn\'t extend the exipration time for the token!',
                        err: err
                    }}) 
                }
            }else {
                cb(404, {'status': 'fail', data: {
                    message: 'Token not found!',
                    err: err
                }})
            }
        })

    }else {
         cb(400, {'status': 'fail', data: {
            message: 'Missing required filed(s)'
        }})
    }
}

handlers._tokens.DELETE = (data, cb) => {
    // ** Get token ID
    // ** Check for token validity
    // ** Delete token 
    const tokenId = typeof(data.queryParams.id) === 'string' && data.queryParams.id.trim() !== undefined ? data.queryParams.id.trim() : false

    if(tokenId) {
        _data.read('tokens', tokenId, (err, token) => {
            if(!err&& token) {
                _data.delete('tokens', tokenId, (err) => {
                    if(!err) {
                        cb(204, {'status': 'success', 'data': null})
                    }else {
                        cb(400, {'status': 'fail', 'data': {message: 'Couldn\'t not delete token', err: err}})
                    }
                })
            }else {
                cb(404, {'status': 'fail', data: {
                    message: 'Token not found!',
                    err: err
                }})
            }
        })
    }else {
        cb(404, {'status': 'fail', data: {
            message: 'Missing required filed(s)'
        }})
    }
}

/**
 * @TODO authentication
 */
handlers._tokens.auth = (id, phone, cb) => {
    // ** validate token ID
    // ** validate token belongs to the user
    const tokenId = typeof(id) === 'string' && id !== undefined ? id : false
   
    _data.read('tokens', tokenId, (err, token) => {
        if(!err && token){
            // ** check token belongs to the user
            const isTokenValid = JSON.parse(token).phone === phone  && JSON.parse(token).expires > Date.now() ? true : false

            if(isTokenValid) {
                cb(true)
            }else {
                cb(false) 
            }
        }else {
            cb(false)
        }
    })
}

/**
 * @TODO Handling Checks
 * @param {*} req 
 * @param {*} res 
 */
handlers._checks = {}
handlers._checks.POST = (data, cb) => {
    // ** Data payload 
    // ** method, url, statusCodes [], protocol
    const method = typeof(data.payload.method) === 'string' && ['PUT', 'GET', 'POST', 'DELETE'].indexOf(data.payload.method.trim()) > -1 ? data.payload.method.trim() : false
    const protocol = typeof(data.payload.protocol) === 'string' && ['http', 'https'].indexOf(data.payload.protocol.trim()) > -1 ? data.payload.protocol.trim() : false
    const url = typeof(data.payload.url.trim()) === 'string' && data.payload.url.trim() !== undefined ? data.payload.url.trim() : false
    const statusCodes = typeof(data.payload.statusCodes) === 'object' && data.payload.statusCodes instanceof Array ? data.payload.statusCodes : false

    if(method && protocol && url && statusCodes) {
        const token = data.headers.token
       
        _data.read('tokens', token, (err, tokenData) => {
            if(!err && tokenData) {
                // ** valid token -> check for the user
                tokenData = unmarshal(tokenData)
                const userPhone = tokenData.phone
                handlers._tokens.auth(tokenData.id, userPhone, (isTokenValid) => {
                    if(isTokenValid) {
                        _data.read('users', userPhone, (err, userData) => {
                            if (!err && userData) {
                                // ** we have the user
                                userData = unmarshal(userData)
                               
                                const checkId = genereateTokenId(12)
                                const check = {
                                    id: checkId,
                                    protocol: protocol,
                                    method: method,
                                    url: `${protocol}://${url}`,
                                    statusCodes: statusCodes,
                                    user: userData.id
                                }

                                _data.create('checks', checkId, check, (err) => {
                                    if (!err) {
                                        const userCheck = typeof (userData.check) === 'object' && userData.check instanceof Array ? userData.check : []
                                        if (userCheck.length >= 5) {
                                            cb(400, { status: 'fail', data: { message: 'You\'ve reached the max +' + userCheck.length } })
                                        }else {
                                            userCheck.push(checkId)
                                            userData.check = userCheck
    
                                            _data.update('users', userData.phoneNumber, userData, (err) => {
                                                if (!err) {
                                                    cb(200, { status: 'success', data: { user: userData} })
                                                } else {
                                                    cb(400, { status: 'fail', data: { err: err, message: 'couldn\'t save the check\'s data!' } })
                                                }
                                            })
                                        }
                                    } else {
                                        cb(400, { status: 'fail', data: { err: err, message: 'couldn\'t save the check\'s data!' } })
                                    }
                                })
                            } else {
                                cb(404, { status: 'fail', data: { message: 'User not found!', err: err } })
                            }
                        })
                    }else {
                        cb(403, { status: 'fail', data: { message: 'Unauthorized!' } })
                    }
                })
            }else {
                cb(400, {status: 'fail', data: {message: 'Invalid token!', err: err}})
            }
        })
    }else {
        cb(400, {status: 'fail', data: {message: 'Missing required fields'}})
    }
}

handlers._checks.GET = (data, cb) => {
    // ** Get token validate token
    // ** retrieve data from the checks collections
    const token = data.headers.token
    _data.read('tokens', token, (err, tokenData) => {
        if(!err && tokenData) {
            tokenData = unmarshal(tokenData)
            const phone = tokenData.phone
            handlers._tokens.auth(tokenData.id, phone, (isTokenValid) => {
                if(isTokenValid) {
                    // ** authorized users 
                    // ** retrieve all users data
                    // ** no query params provides
                    /*
                     * @ TODO
                     -> use the user's phone number to retrieve data from the checks 
                     collection. Retrieved data should strictly belong to the user
                     */
                    _data.read('users', phone, (err, user) => {
                        if(!err && user) {
                            // ** successfully read through users collections
                            user = unmarshal(user)
                            const checks = []
                            const sourceStream = new Readable({
                                read() {
                                    let checkProcessed = 0;
                                    user.check.forEach((id) => {
                                        _data.read('checks', id, (err, check) => {
                                            if(!err && check) {
                                                this.push(check)
                                            }
                                            checkProcessed++
                                            if(checkProcessed === user.check.length){
                                                this.push(null)
                                            }
                                        })
                                    })

                                }
                            })
                            const destinationStream = new Writable({
                                write(chunk, encoding, cb) {
                                    checks.push(JSON.parse(String(chunk)))
                                    cb()
                                }
                            })
                            
                            destinationStream.on('finish', () => {
                                cb(200, { status: 'success', result: checks.length, data: { checks} })
                            })
                            
                            sourceStream.pipe(destinationStream)
                        }else {
                            cb(400, {status: 'fail', data: {message: 'Couldn\'t retreive user\'s data!', err: err}})
                        }
                    })
                }else {
                    cb(403, {status: 'fail', data: { message: 'Unauthorized!'}})
                }
            })
        }else {
            cb(400, {status: 'fail', data: {message: 'Invalid token!', err: err}})
        }
    })
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
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
}

module.exports = routesHandler