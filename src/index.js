const readline = require('readline');
const fs = require('fs');
// import node-jq to interact with JSON files
const jq = require('node-jq');

// Check if a file path was provided as a command line argument
if (process.argv.length < 4) {
  console.log('Usage: node interactWithJson.js <path-to-json-file> "jq filter"');
  process.exit(1);
}

const jqfilter = process.argv[3];
const filePath = process.argv[2];
let jsonData = [];

const outfile = filePath.replace('.json', '-responses.json');
try {
  const resume = fs.existsSync(outfile) ? true : false;
  // check whether outfile already exists
  if (resume) {
    console.log('Output file already exists:', outfile);
  };
  const rawData = fs.readFileSync(resume ? outfile : filePath);
  jsonData = JSON.parse(rawData);
  if (!resume) {
    jsonData = jsonData.map(item => { return { object: item, response: "" } });
  };
} catch (error) {
  console.error('Error reading or parsing the JSON file:', error.message);
  process.exit(1);
}

console.log(JSON.stringify(jsonData, null, 2));

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Function to process each item
const processItem = async (jsonData) => {
  for (let currentIndex = 0; currentIndex < jsonData.length; currentIndex++) {
    console.log('Current object:', JSON.stringify(await jq.run(".object | " + jqfilter, jsonData[currentIndex], { input: 'json', output: 'json' }), null, 2));
    console.log('Current answer:', jsonData[currentIndex].response);
    const answer = await askQuestion('What is your answer? (y/n/q to quit): ');
    console.log('Answer:', answer);
    if (answer.toLowerCase() === 'q') {
      return jsonData;
    };
    if (answer !== '') {
      // Record the response
      jsonData[currentIndex].response = answer;
      //console.log(jsonData);
    };
  };
  return jsonData;
}

function writeout(responses) {
  console.log('All objects processed. User responses written to ', outfile);
  fs.writeFileSync(outfile, JSON.stringify(responses, null, 2));
}

(async () => {
  const responses = await processItem(jsonData);
  console.log(JSON.stringify(responses, null, 2));
  writeout(responses);
  process.exit(0);
})();

// Start processing items

