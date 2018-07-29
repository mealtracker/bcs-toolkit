const _ = require('lodash')
const date = new Date();
const Promise  = require("bluebird");
const inquirer  = require("inquirer");

module.exports = {
    async call(userId,assignmentId){
        const request = require('./login').authedRequest;
        let res = await request({
            method: 'GET',
            uri: `/instructor/homework/grade/${userId}/${assignmentId}?t=${date.getMilliseconds()}`,
            json: true
        })
        return _.map( _.values(res.submission.urls), (urlR) => urlR.submissionURL) || []
    }
}
