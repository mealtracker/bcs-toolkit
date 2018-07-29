const _ = require('lodash')
const date = new Date();

module.exports = {
    call(cohort,hwid){
        const request = require('./login').authedRequest;
        return request({
            method: 'GET',
            uri: `/instructor/homework/${cohort}/${hwid}?t=${date.getMilliseconds()}`,
            json: true
        })
            .then((res) => {

                console.log('submissions')
                return res
            })
            .catch(console.error)
    }
}
