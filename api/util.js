const _ = require('lodash')
let utils = {}

utils.isValidGitUrl = (url) => {
    let gitUrl = _.trim(url)
    let isHttp = _.startsWith('http', gitUrl)
    if(isHttp){

    }
    let urlSplit = _.split(gitUrl, "/");
    let lastParam = _.last(urlSplit);
    return _.endsWith(lastParam, ".git")
}

utils.parseValidGitUrls = (arrUrls) => {
    let splitted
    splitted = _.split(gitURL, "/");
    let lastParam = _.last(splitted);
    if (_.endsWith(lastParam, ".git")) {
        gitURL = _.trimEnd(gitURL, "git");
    }
    let gitFilePath = `${filePath}`;
    console.log(gitURL, gitFilePath, splitted);
    if (_.isEqual(splitted[2], "github.com")) {
        gitFilePath = gitFilePath + _.last(splitted);
        console.log("ok", gitURL, localPath);
        const errorAndAttemptOpen = () => {
            return NodeGit.Repository.open(localPath);
        };

    }
}

module.exports = utils
