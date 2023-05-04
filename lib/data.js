// *** HANDLING CRUD OPERATIONS
const fs = require('fs')
const path = require('path')

// ** Data library container
const lib = {}

// *** Creating a file
const base_dir = path.join(__dirname, '/../.data/')

lib.create = (dir, file_name, data, cb) => {
    const path = `${base_dir}${dir}/${file_name}.json`
    fs.open(path, 'wx', (err, file_descriptor) => {
        if(!err && file_descriptor) {
            const parsed_data = JSON.stringify(data)
            fs.writeFile(file_descriptor, parsed_data, (err) => {
                if(!err) {
                    fs.close(file_descriptor, (err) => {
                        if(!err) {
                            cb(false)
                        }
                    })
                }
            })
        }else {
            cb('Couldn\'t write to the file! The file might already exist.')
        }
    })
}

lib.read = (dir, file_name, cb) => {
    const path = `${base_dir}${dir}/${file_name}.json`
    fs.open(path, 'r', (err, file_descriptor) => {
        if(!err && file_descriptor) {
            fs.readFile(file_descriptor, 'utf-8', (err, data) => {
                if(!err) {
                   cb(err, data) 
                }
            })
        }else {
            cb(err)
        }
    })
}

lib.update = (dir, file_name, data, cb) => {
    const path = `${base_dir}${dir}/${file_name}.json`
    fs.open(path, 'r+', (err, file_descriptor) => {
        if(!err && file_descriptor) {
            const parsed_data = JSON.stringify(data)
            fs.ftruncate(file_descriptor, (err) => {
                if(!err) {
                    fs.writeFile(file_descriptor, parsed_data, (err) => {
                        if(!err) {
                            fs.close(file_descriptor, (err) => {
                                if(!err) {
                                    cb(err)
                                }else {
                                    cb('Error closing the file')
                                }
                            })
                        }else {
                            cb('Error writting to the file')
                        }
                    })
                }else {
                    cb('Error occurred during truncating')
                }
            })
        }else {
            cb('Couldn\'t open the file for updating! The file might not exist yet.')
        }
    })
}

lib.delete = (dir, file_name, cb) => {
    const path = `${base_dir}${dir}/${file_name}.json`
    fs.unlink(path, (err) => {
        if(!err) {
            cb(false)
        }else {
            cb('Couldn\'t delete the file!')
        }
    })
}

// ** Export data library container
module.exports = lib