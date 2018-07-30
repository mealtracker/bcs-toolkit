const _ = require("lodash");
const date = new Date();
const Promise = require("bluebird");
const inquirer = require("inquirer");
const config = require("../config.json");
const overwrites = config.githubOverwrites || {};

module.exports = {
  async call(userId, assignmentId) {
    const request = require("./login").authedRequest;
    let res = await request({
      method: "GET",
      uri: `/instructor/homework/grade/${userId}/${assignmentId}?t=${date.getMilliseconds()}`,
      json: true
    });
    return {
      userId,
      urls: _.get(res, "submission.urls", []),
      data: _.get(res, "submission.data[0]", {})
    };
  },
  urls({ urls }) {
    return _.map(_.values(urls), urlR => urlR.submissionURL) || [];
  },
  githubUserName({ userId, data }) {
    return _.has(overwrites, userId.toString())
      ? overwrites[userId]
      : _.get(data, "GitHubUserName", false);
  }
};
