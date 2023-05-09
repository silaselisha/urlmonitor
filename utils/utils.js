const crypto = require('crypto')
const config = require('../config')

exports.hashPassword = (password) => {
    if(typeof(password) === 'string' && password.trim().length > 8) {
        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')

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

exports.genereateTokenId = (len) => {
    const tokenLength = typeof(len) === 'number' ? len : false
    const allPossibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789@$_!'

    let tokenId = ''
    for(let x = 0; x < tokenLength; x++) {
        tokenId += allPossibleCharacters.charAt(Math.floor(Math.random() * allPossibleCharacters.length))
    }
    return tokenId;
}