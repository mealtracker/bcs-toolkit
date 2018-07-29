const Promise = require('bluebird')
const setLogin = require('./api/login')
const getSubmissions = require('./api/homeworkSubmission')
const getHomeworkList = require('./getHomeworkList')
const login = require('./login')
module.exports = {
    login
}
