'use-strict'
const request = require('request')
const _ = require('lodash')
const Git = require('nodegit')
const cypress = require('cypress')
const Promise = require('bluebird')
const config = require('./config.json')
//TODO: get from a private env file/parameter

//Note: assignment(homework) ids differ for each section
//const ASSIGNMENT_ID = 15430 //homework id
//const SECTION_ID = 406 //(T/TH)

const ASSIGNMENT_ID = 15430 //homework id
const SECTION_ID = 499 //(M/W)
const REPOS = ['Bootstrap-Portfolio', 'Responsive-Portfolio']

const API_BASE_URL = 'https://bootcampspot-v2.com/api'
const TIMESTAMP = Date.now()
/* =================================================================================== */
let apiRequest, urls, gitUser

//Get Bearer token
//TODO: save bearer to a cookie to reduce calls
//TODO: use promises or async await to fix nested callbacks
//TODO: separate to only generate when no bearer is already set
//TODO: use google drive api to seperate students based on logged in userId
request.post({
    uri: `${API_BASE_URL}/v2/login`,
    json: true,
    body: {
        email: config.username,
        password: config.password
    }
},
    function (error, response, body) {
        if (!body.jwt) throw new Error('NO AUTH DEFINED') //use lodash

        //Authed and set default bearer token, ready to perform calls!
        console.log(`[Token Set]: ${body.jwt}`)

        //Set defaults for request
        apiRequest = request.defaults({
            baseUrl: API_BASE_URL,
            json: true,
            auth: {
                bearer: `${body.jwt}`
            }
        })

        //Get list of users and submission 
        //TODO: save list of user ids of students somewhere once then we can just reference ids of users for submissions
        //https://bootcampspot-v2.com/gradebook/${SECTION_ID}/grade/${ASSIGNMENT_ID}/${userId}

        apiRequest.get(`/instructor/homework/${SECTION_ID}/${ASSIGNMENT_ID}?t=${TIMESTAMP}`,
            function (hwErr, hwResponse, hwBody) {
                //console.log(hwBody) //list of users who submitted (with no urls D: )

                //TODO: look into sockets to reduce the amount of calls.. as 20+ calls may trigger rate limiting from api
                //TODO: temporarily add a delay/wait for now.

                Promise.each(hwBody, ({ UserId, AssignmentID, firstname, lastname }, index) => {
                    //console.log(index)
                    //if(index !== 2) return false

                    let name = `${firstname}-${lastname}`

                    if (AssignmentID === 0) return false

                    //Get the urls from the assignment/submission id (note: you can see username from here.. and the github username in the response)
                    apiRequest.get(`/instructor/homework/grade/${UserId}/${AssignmentID}?t=${TIMESTAMP}}`,
                        function (aErr, aResponse, aBody) {
                            urls = _.get(aBody, 'submission.urls', [])
                            if(urls.length <= 0) return

                            //TODO: lodash parse or do some validation on git urls
                            let submissionURL
                            for(let x=0; x < urls.length ; x++) {
                                if(!_.has(urls[x], 'submissionURL')) continue
                                submissionURL = _.get(urls[x], 'submissionURL', 'invalid url')
                                console.log(name, submissionURL)
                            }

                            gitUser = _.get(config, `userIdToGit.${UserId}`,_.get(aBody, 'submission.data.0.GitHubUserName'))

                            for(let repo of REPOS) {
                                const repoPath = `./repos/${name}(${gitUser})/${repo}`

                                Git.Clone(`https://github.com/${gitUser}/${repo}`, repoPath)
                                    // Look up this known commit.
                                    .then(function(repo) {
                                        // Use a known commit sha from this repository.
                                        return repo.getMasterCommit();
                                    }).then(function(){

                                        if(true){
                                            return true
                                        }

                                        return cypress.run({
                                            config: {
                                                trashAssetsBeforeHeadlessRuns: false
                                            },
                                            spec: './cypress/integration/assignment_3_media.js',
                                            env: {
                                                FOLDER_PATH: repoPath,
                                            }
                                        })
                                    })
                                    .catch(function(err) { console.log(err); });
                            }
                            //console.log(aBody)
                            // console.log(`${UserId}`, urls)

                        })
                })
            }
        )
    }
)
