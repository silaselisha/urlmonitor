const crypto = require('crypto')
const config = require('../config')

exports.hashPassword = (password) => {
    if(typeof(password) === 'string' && password.trim().length > 8) {
        const hashedPassword = crypto.createHash('sha256').update(config.secret).digest('hex')
        console.log(config.secret)

        return hashedPassword
    }else {
        return false
    }
}

exports.unmarshal = (data) => {
    try {
       return JSON.parse(data) 
    } catch (error) {
        return {}
    }
}