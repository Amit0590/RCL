/**
 * Test script to verify connection to AWS Cloud DynamoDB
 * Run this script to check if your AWS credentials are properly configured
 */

require('dotenv').config();
const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

// Log environment for debugging
const awsRegion = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

console.log('Testing AWS DynamoDB connection with the following configuration:');
console.log(`AWS Region: ${awsRegion}`);
console.log(`AWS Access Key ID: ${accessKeyId ? '********' : 'Not set'}`);
console.log(`AWS Secret Access Key: ${secretAccessKey ? '********' : 'Not set'}`);
console.log('');

// Check for placeholder values from template
if (awsRegion === 'your-aws-region') {
  console.error('\n❌ Error: You are using the template placeholder for AWS region.');
  console.error('Please update your .env file with your actual AWS region (e.g., us-east-1)');
  process.exit(1);
}

if (accessKeyId === 'your-access-key') {
  console.error('\n❌ Error: You are using the template placeholder for AWS Access Key ID.');
  console.error('Please update your .env file with your actual AWS Access Key ID.');
  process.exit(1);
}

if (secretAccessKey === 'your-secret-key') {
  console.error('\n❌ Error: You are using the template placeholder for AWS Secret Access Key.');
  console.error('Please update your .env file with your actual AWS Secret Access Key.');
  process.exit(1);
}

// Create AWS DynamoDB client
const client = new DynamoDBClient({
  region: awsRegion,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
});

// Test the connection by listing tables
async function testConnection() {
  try {
    console.log('Attempting to connect to AWS DynamoDB...');
    
    const command = new ListTablesCommand({});
    const response = await client.send(command);
    
    console.log('\n✅ Successfully connected to AWS DynamoDB!');
    
    if (response.TableNames && response.TableNames.length > 0) {
      console.log('\nAvailable tables:');
      response.TableNames.forEach(tableName => {
        console.log(`- ${tableName}`);
      });
      
      // Check if our expected tables exist
      const requiredTables = ['Users', 'Projects', 'Submissions'];
      const missingTables = requiredTables.filter(
        table => !response.TableNames.includes(table)
      );
      
      if (missingTables.length > 0) {
        console.log('\n⚠️ Warning: The following required tables are missing:');
        missingTables.forEach(table => console.log(`- ${table}`));
        console.log('\nThese tables will be created automatically when the application starts.');
      } else {
        console.log('\nAll required tables exist in your DynamoDB instance! ✅');
      }
    } else {
      console.log('\nNo tables found in this AWS region. Tables will be created when the application starts.');
    }
    
  } catch (error) {
    console.error('\n❌ Failed to connect to AWS DynamoDB:');
    console.error(`Error: ${error.message}`);
    console.error('\nPossible causes:');
    console.error('- Invalid AWS credentials');
    console.error('- Missing or incorrect AWS region');
    console.error('- Insufficient IAM permissions');
    console.error('- Network connectivity issues');
    
    console.error('\nPlease check your .env file and AWS configuration.');
  }
}

testConnection();