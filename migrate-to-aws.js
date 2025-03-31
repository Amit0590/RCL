/**
 * Data Migration Script for AWS Cloud DynamoDB
 * This script migrates data from local DynamoDB to AWS Cloud DynamoDB
 * 
 * Usage: 
 * 1. Set up your AWS credentials in .env
 * 2. Run: node migrate-to-aws.js
 */

require('dotenv').config();
const AWS = require('aws-sdk');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  PutCommand 
} = require('@aws-sdk/lib-dynamodb');

// Local DynamoDB Configuration
const localConfig = {
  region: 'us-east-1',
  endpoint: 'http://localhost:8000',
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local'
  }
};

// AWS Cloud DynamoDB Configuration
const awsConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
};

// Create clients
const localClient = new DynamoDBClient(localConfig);
const localDynamoDb = DynamoDBDocumentClient.from(localClient);

const awsClient = new DynamoDBClient(awsConfig);
const awsDynamoDb = DynamoDBDocumentClient.from(awsClient);

// Tables to migrate
const tables = ['Users', 'Projects', 'Submissions'];

// Helper to get all items from a table
async function scanTable(tableName, client) {
  const command = new ScanCommand({ TableName: tableName });
  try {
    const result = await client.send(command);
    return result.Items || [];
  } catch (error) {
    console.error(`Error scanning ${tableName}:`, error);
    return [];
  }
}

// Helper to insert an item into a table
async function insertItem(tableName, item, client) {
  const command = new PutCommand({
    TableName: tableName,
    Item: item
  });
  try {
    await client.send(command);
    return true;
  } catch (error) {
    console.error(`Error inserting into ${tableName}:`, error);
    return false;
  }
}

// Main migration function
async function migrateData() {
  console.log('=== Starting DynamoDB Migration ===');
  
  // Ensure AWS credentials are set
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('AWS credentials not found. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file');
    process.exit(1);
  }

  // Create AWS DynamoDB tables if they don't exist
  try {
    console.log('Initializing AWS Cloud DynamoDB tables...');
    // Use the AWS SDK v2 for table creation as it's already set up in dynamodb.js
    process.env.NODE_ENV = 'production';
    const dynamoDB = require('./ContentCreationWebsite/db/dynamodb');
    await dynamoDB.initializeTables();
  } catch (error) {
    console.error('Error creating AWS Cloud DynamoDB tables:', error);
    console.log('Continuing with migration anyway...');
  }

  // Process each table
  for (const tableName of tables) {
    console.log(`\nMigrating ${tableName}...`);
    
    // Get data from local DynamoDB
    console.log(`- Reading data from local ${tableName} table`);
    const items = await scanTable(tableName, localDynamoDb);
    console.log(`- Found ${items.length} items in local ${tableName} table`);
    
    // Skip if no items found
    if (items.length === 0) {
      console.log(`- No items to migrate for ${tableName}`);
      continue;
    }
    
    // Insert data into AWS Cloud DynamoDB
    console.log(`- Migrating ${items.length} items to AWS Cloud ${tableName} table`);
    let successCount = 0;
    
    for (const item of items) {
      const success = await insertItem(tableName, item, awsDynamoDb);
      if (success) successCount++;
    }
    
    console.log(`- Successfully migrated ${successCount}/${items.length} items to AWS Cloud ${tableName} table`);
  }
  
  console.log('\n=== Migration Complete ===');
}

// Run migration
migrateData().catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});