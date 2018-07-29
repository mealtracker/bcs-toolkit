const NodeGit = require("nodegit");
const _ = require('lodash');
const date = new Date();

module.exports = {
    call(gitUrl,filePath) {

        const errorAndAttemptOpen = (err) => {
            console.log(err)
            return NodeGit.Repository.open(filePath);
        }

        // This is a required callback for OS X machines.  There is a known issue
        // with libgit2 being able to verify certificates from GitHub.
        const cloneOptions = {
            fetchOpts: {
                callbacks: {
                    certificateCheck: function () {
                        return 1;
                    }
                }
            }
        };

        console.log(gitUrl, filePath)

        return NodeGit.Clone(gitUrl, filePath, cloneOptions)
                .catch(errorAndAttemptOpen)
                // Look up this known commit.
                .then(function (repo) {
                    console.log("Is the repository bare? %s", Boolean(repo.isBare()));
                    // Use a known commit sha from this repository.
                    return repo.getMasterCommit();
                })
            .catch(console.error)
            .then(function(){
                console.log(
                    '===========================================\n',
                    `Successfully Pulled Repo: ${gitUrl}`,
                    '\n==========================================='
                );
                return 'OK'
            });
    }
}
