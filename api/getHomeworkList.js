const _ = require('lodash')
const date = new Date();
const month = _.padStart(date.getMonth(), 2,'0')
date.setDate(32)
const lastMonth = _.padStart(date.getMonth(), 2,'0')


module.exports = {
    call(cohort){
        const request = require('./login').authedRequest;
        return request({
            method: 'GET',
            uri: `/v2/syllabus/${cohort}/homework/2018-${month}`,
            json: true
        })
        .then((res) => {
            return request({
                method: 'GET',
                uri: `/v2/syllabus/${cohort}/homework/2018-${lastMonth}`,
                json: true
            })
            .then((reslast) => {
                return res.concat(reslast);
            })
        })
        .catch(console.error)
    }
}
