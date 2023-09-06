require('dotenv').config();
const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Replace with your GitHub Personal Access Token and GitHub username
const accessToken = process.env.GITHUB_ACCESS_TOKEN;
const username = process.env.GITHUB_USERNAME;
const repository = process.env.REPOSITORY;
const limit = 100; // max limit is 100

const headers = {
  'Authorization': `Bearer ${accessToken}`,
};

async function getPullRequests(cursor) {
  // GraphQL query to fetch the PR comments count by the author
  const query = `
  {
    organization(login: "${username}") {
      repository(name: "${repository}") {
        pullRequests(first: ${limit}, after: ${cursor ? `"${cursor}"` : null}) {
          pageInfo {
            endCursor
            startCursor
          }
          nodes {
            author {
              login
            }
            totalCommentsCount
          }
          totalCount
        }
      }
    }
  }
  `;

  const response = await axios.post('https://api.github.com/graphql', { query }, { headers })
  const prs = response.data.data.organization.repository.pullRequests;
  return prs;
}

async function main() {
  const commentsCountByPRAuthor = {};
  let allNodes = [];
  let cursor = "";

  while (true) {
    const {nodes, pageInfo} = await getPullRequests(cursor);
    if (nodes.length > 0) {
      allNodes = allNodes.concat(nodes);
      cursor = pageInfo.endCursor;
      console.log("PRs count:", allNodes.length);
    } else {
      break;
    }
  }

  // Calculate the total comments count
  allNodes.forEach((node) => {
    if (commentsCountByPRAuthor[node.author.login]) {
      commentsCountByPRAuthor[node.author.login] += node.totalCommentsCount;
    } else {
      commentsCountByPRAuthor[node.author.login] = node.totalCommentsCount;
    }
  });

  const commentsCountByPRAuthors = [];
  Object.keys(commentsCountByPRAuthor).forEach(key => {
    commentsCountByPRAuthors.push({name: key, comments: commentsCountByPRAuthor[key]});
  });
  console.log("commentsCountByPRAuthors:", commentsCountByPRAuthors);

  // Define the CSV file's header
  const csvWriter = createCsvWriter({
    path: `${username}_${repository}_PR_comments.csv`,
    header: [
      { id: 'name', title: 'Name' },
      { id: 'comments', title: 'PR Comments' }
    ],
  });

// Write the data to the CSV file
  csvWriter
    .writeRecords(commentsCountByPRAuthors)
    .then(() => {
      console.log('CSV file has been written successfully');
    })
    .catch((error) => {
      console.error('Error:', error);
    });

}

main();
