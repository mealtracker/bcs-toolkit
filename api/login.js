const request = require('request-promise');

module.exports = {
    authedRequest(){ console.log('not authed'); },

    setAuth(jwt){
        //Set defaults for request
        this.authedRequest = request.defaults({
            baseUrl: `${process.env.URL}`,
            auth: {bearer: `${jwt}`},
            json: true,
        });
    },
    call(){
        return request({
            method: 'POST',
            uri: `${process.env.URL}/v2/login`,
            body: {
                email: process.env.USER,
                password: process.env.PASSWORD
            },
            json: true
        })
        .then((body) => {
            if (!body.jwt) throw new Error('NO AUTH DEFINED') //use lodash
            this.setAuth(body.jwt)
            return body.jwt
        })
        .catch(console.error)
    }
}
