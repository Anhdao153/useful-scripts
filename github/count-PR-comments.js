/**
 * Notes
 * Dry-run: https://docs.github.com/en/graphql/overview/explorer
 */
require('dotenv').config();
const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const mkdir = require('fs').mkdir;
// Replace with your GitHub Personal Access Token and GitHub username
const accessToken = process.env.ACCESS_TOKEN;
const username = process.env.USERNAME;
const repository = process.argv[2];
console.log(repository);
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
            permalink
            author {
              login
            }
            reviews(first: 100, after: null) {
              nodes {
                comments(first: 20, after: null) {
                  nodes {
                    author {
                      login
                    }
                  }
                }
              }
              totalCount
            }
            totalCommentsCount
          }
          totalCount
        }
      }
    }
  }
  `;

  const response = await axios.post('https://api.github.com/graphql', {query}, {headers})
  const prs = response.data.data.organization.repository.pullRequests;
  return prs;
}

async function main() {
  const commentsCountByPRAuthor = {};
  let allNodes = [];
  let cursor = '';

  while (true) {
    const {nodes, pageInfo} = await getPullRequests(cursor);
    if (nodes.length > 0) {
      allNodes = allNodes.concat(nodes);
      cursor = pageInfo.endCursor;
      console.log('PRs count:', allNodes.length);
    } else {
      break;
    }
  }

  // Calculate the total comments count
  allNodes.forEach((node) => {
    const commentAuthors = node.reviews.nodes
      .map(node => node.comments.nodes)
      .flat()
      .map(commentNode => commentNode.author.login);
    const totalCommentsNotByAuthorCount = commentAuthors.filter(authorLogin => authorLogin != node.author.login).length;

    if (commentsCountByPRAuthor[node.author.login]) {
      commentsCountByPRAuthor[node.author.login] += totalCommentsNotByAuthorCount;
    } else {
      commentsCountByPRAuthor[node.author.login] = totalCommentsNotByAuthorCount;
    }
  });

  const commentsCountByPRAuthors = [];
  Object.keys(commentsCountByPRAuthor).forEach(key => {
    commentsCountByPRAuthors.push({name: key, comments: commentsCountByPRAuthor[key]});
  });
  console.log('commentsCountByPRAuthors:', commentsCountByPRAuthors);

  // Define the CSV file's header
  // const name = new Date();
  // const folderName = `${name.getDate().toString()+ '-' + name.getMonth().toString()+ '-' + name.getFullYear().toString()}`;
  const folderName = process.argv[3];
  console.log(folderName, 'folderName');
  // console.log(folderName, '__dirname');
  mkdir(`${__dirname}/${folderName}`, { recursive: true }, (err) => {
    if (err) {
        console.error('Error creating folder:', err);
    } else {
        console.log('Folder created successfully.');
    }
});
  const csvWriter = createCsvWriter({
    path: `${__dirname}/${folderName}/${username}_${repository}_PR_comments.csv`,
    header: [
      {id: 'name', title: 'Name'},
      {id: 'comments', title: 'PR Comments'}
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
