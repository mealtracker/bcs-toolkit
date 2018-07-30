const _ = require("lodash");
const Promise = require("bluebird");
const octokit = require("@octokit/rest")({
  debug: true
});

module.exports = {
  async call(username) {
    octokit.authenticate({
      type: "basic",
      username: process.env.GITHUB_USER,
      password: process.env.GITHUB_PASS
    });

    const result = await octokit.repos.getForUser({
      username,
      sort: "updated",
      per_page: 5
    });

    return _.map(result.data, urlR => urlR.clone_url) || [];
  }
};
