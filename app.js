require("dotenv").config();
const request = require("request");
const _ = require("lodash");
const NodeGit = require("nodegit");
const Promise = require("bluebird");
const fs = require("fs-extra");
const url = require("url"); // built-in utility
const inquirer = require("inquirer");
const ui = new inquirer.ui.BottomBar();
const login = require("./api/login");
const util = require("util");
const helper = require("./api/util");
const exec = util.promisify(require("child_process").exec);
const { spawn } = require("child_process");

let session;

function prompt() {
  let choices = [];

  if (!_.isEmpty(session.jwt)) choices.push("Start Process");

  choices.push("Login", "Show Session Data", "Flush Repo Folders");

  inquirer
    .prompt([
      {
        type: "list",
        name: "commandType",
        message: "What do you want to do?",
        choices
      }
    ])
    .then(async ({ commandType }) => {
      switch (commandType) {
        case "Login":
          session.jwt = await login.call();
          ui.log.write("You are logged in.");
          write(session, prompt);
          break;
        case "Start Process":
          session.cohort = await getCohort();
          session.hwId = await getHomeworkId(
            await require("./api/getHomeworkList").call(session.cohort)
          );
          //session.pullOptions = await getPullOptions();
          session.submissions = await require("./api/getSubmissions").call(
            session.cohort,
            session.hwId
          );
          session.selectedSubmissions = await promptSubmissions(
            session.submissions
          );

          await processSubmissions(session.selectedSubmissions);

          console.log("===== Finished =====\n");
          prompt();
          break;
        case "Show Session Data":
          console.log(session);
          prompt();
          break;

        case "Flush Repo Folders":
          fs.emptyDirSync("./tmp");
          fs.emptyDirSync("./repos");
          console.log("Flushed the repos folder");
          prompt();
          break;
        default:
          console.log("Good Bye");
          break;
      }
    });
}

function promptSubmissions(submissions) {
  let filtered = _.filter(
    submissions,
    submission =>
      !_.isEqual(_.get(submission, "submissionid", 0), 0) &&
      !_.isNull(_.get(submission, "submissionDate"))
  );
  let choices = _.map(filtered, user => {
    return { name: `${user.firstname} ${user.lastname}`, value: user };
  });

  //checkbox to pull down each user

  return inquirer
    .prompt([
      {
        type: "checkbox",
        name: "selected",
        message: "Students who submitted an assignment",
        choices
      }
    ])
    .then(({ selected }) => {
      return selected;
    });
}

async function promptSubmissionUrl({
  name,
  submission: { UserId, AssignmentID }
}) {
  let dataProcessor = require("./api/getSubmissionDataById");
  const validateGitUrl = uri =>
    helper.isValidGitUrl(uri) ? uri : promptRebuildUrl(uri);
  let data = await dataProcessor.call(UserId, AssignmentID, true);
  let githubUserName = dataProcessor.githubUserName(data);

  let choices = _.map(dataProcessor.urls(data), value => ({
    name: value,
    value
  }));

  if (githubUserName)
    choices.push({
      name: `Pull from github.com/${githubUserName}`,
      value: githubUserName
    });

  choices.push({ name: "Next Person", value: "NEXT" });

  return inquirer
    .prompt([
      {
        type: "list",
        name: "repo",
        message: `Pull down a repository for ${name} (${name})`, //TODO: automate filtering
        choices
      }
    ])
    .then(async ({ repo }) => {
      switch (repo) {
        case "NEXT":
          return repo;
        case githubUserName:
          return await promptGithubRepo(githubUserName);
        default:
          return validateGitUrl(repo);
      }
    });
}

async function promptGithubRepo(githubUserName) {
  let choices = await require("./api/getGithubRepoUrls").call(githubUserName);

  return inquirer
    .prompt([
      {
        type: "list",
        name: "repo",
        message: `Repositories for ${githubUserName}`,
        choices
      }
    ])
    .then(({ repo }) => {
      return repo;
    });
}

function promptPostPull(filePath) {
  return inquirer
    .prompt([
      {
        type: "list",
        name: "post",
        message: "Post Script",
        choices: [
          { name: "npm i", value: "npm i" },
          { name: "ls", value: "ls" },
          { name: "custom", value: "custom" },

          { name: "run cypress/test", value: "run something" },
          { name: "Done", value: "next" }
        ]
      }
    ])
    .then(async ({ post }) => {
      const execCmd = (cmd, params = []) => {
        return new Promise((resolve, reject) => {
          let child = spawn(cmd, params, { cwd: filePath, shell: true });

          child.stdout.on("data", function(data) {
            // output will be here in chunks
            console.log(`stdout: ${data}`);
          });
          child.stderr.on("data", data => {
            console.log(`stderr: ${data}`);
          });
          child.on("close", code => {
            console.log(`child process exited with code ${code}`);
            resolve();
          });
          child.on("error", err => {
            console.log("Failed to start subprocess.", err);
            reject(err);
          });
        });
      };

      switch (post) {
        case "next":
          return "NEXT";
        case "npm i":
          await execCmd("npm install");
          return promptPostPull(filePath);
        case "ls":
          await execCmd("dir", []);
          return promptPostPull(filePath);
        default:
          return promptPostPull(filePath);
      }
    });
}
function promptCustomCmd(filePath, isFirst = true) {
  return new Promise((resolve, reject) => {
    inquirer
      .prompt([
        {
          type: "input",
          name: "cmd",
          message: isFirst ? "Enter your command.  Type :exit to exit \n" : "$ "
        }
      ])
      .then(({ cmd }) => {
        if (_.isEqual(cmd, ":exit")) return resolve("DONE");
        let child = spawn(cmd, [], { cwd: filePath, shell: true });

        child.stdout.on("data", function(chunk) {
          // output will be here in chunks
          console.log("$ ", chunk.toString());
        });
        child.on("close", code => {
          if (!_.isEqual(code, 0))
            console.log(`child process exited with code ${code}`);
          if (!_.isEqual(cmd, ":exit")) resolve("OK");
          return promptPostPull(filePath);
        });
      });
  });
}
//set cohort
//set homework id
//set ta list

function getCohort() {
  return inquirer
    .prompt([
      {
        type: "list",
        name: "cohort",
        message: "Select Cohort?",
        choices: [
          { name: "Mon/Wed", value: 499 },
          { name: "Tues/Thu", value: 406 }
        ]
      }
    ])
    .then(({ cohort }) => {
      return cohort;
    });
}
function getHomeworkId(list) {
  let choices = _.map(list, item => {
    return { name: item.Name, value: item.ID };
  });

  return inquirer
    .prompt([
      {
        type: "list",
        name: "answer",
        message: "Select Homework",
        choices: choices
      }
    ])
    .then(({ answer }) => {
      return answer;
    });
}

async function processSubmissions(submissions) {
  const processSubmission = async submission => {
    const name = `${_.get(submission, "firstname")} ${_.get(
      submission,
      "lastname"
    )}`;

    const url = await promptSubmissionUrl({ name, submission });
    if (_.isEqual(url, "NEXT")) return submission;
    let localRepoPath = `./repos/${name}`;
    fs.emptyDirSync(localRepoPath);
    await require("./api/pullRepo").call(url, localRepoPath);
    await promptPostPull(`./repos/${name}`);
    return processSubmission(submission);
  };
  return await Promise.each(submissions, processSubmission);
}

function promptRebuildUrl(uri) {
  let url = _.trimStart(uri, "http://");
  url = _.trimStart(url, "https://");
  let choices1 = _.split(url, ".");
  let choices2 = _.split(url, "/");
  let choices = choices1.concat(choices2);

  let formatted = () =>
    inquirer
      .prompt([
        {
          type: "list",
          name: "userName",
          message: "Choose the username for the url",
          choices
        },
        {
          type: "list",
          name: "repoName",
          message: "Choose the repo name for the url",
          choices
        },
        {
          type: "confirm",
          name: "isOk",
          message: ({ userName, repoName }) =>
            `Is this url right? https://github.com/${userName}/${repoName}`
        }
      ])
      .then(({ userName, repoName, isOk }) => {
        if (!isOk) return formatted();
        return `https://github.com/${userName}/${repoName}`;
      });

  return formatted();
}

function start() {
  fs.readJson("./cookie.json", { throws: false }, (err, jsonData) => {
    if (err) console.error(err);
    session = jsonData || {
      homeworkList: [],
      pullOptions: [],
      jwt: false
    };
    if (session.jwt) {
      ui.log.write("You are logged in.");
      login.setAuth(session.jwt);
    }

    prompt();
  });
}

function write(session = {}, cb) {
  fs.writeJson("./cookie.json", session, err => {
    if (err) return console.error(err);
    cb();
  });
}
start();
