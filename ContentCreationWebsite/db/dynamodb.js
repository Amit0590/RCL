const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand, 
  ScanCommand, 
  QueryCommand 
} = require('@aws-sdk/lib-dynamodb');

// DynamoDB configuration
const config = {
  region: process.env.AWS_REGION || 'us-east-1'
};

// Add credentials if provided via environment variables
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  config.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  };
}

// Use local DynamoDB if we're in development and endpoint is provided
if (process.env.NODE_ENV === 'development' && process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
  console.log(`Using local DynamoDB endpoint: ${process.env.DYNAMODB_ENDPOINT}`);
} else {
  console.log(`Using AWS Cloud DynamoDB in region: ${config.region}`);
}

const client = new DynamoDBClient(config);
const docClient = DynamoDBDocumentClient.from(client);

// Helper functions for common database operations
const db = {
  // User operations
  async getUserByEmail(email) {
    const command = new QueryCommand({
      TableName: "Users",
      IndexName: "EmailIndex",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email
      }
    });
    
    try {
      const result = await docClient.send(command);
      return result.Items && result.Items.length > 0 ? result.Items[0] : null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  },

  async getUserById(id) {
    const command = new GetCommand({
      TableName: "Users",
      Key: { id }
    });
    
    try {
      const result = await docClient.send(command);
      return result.Item;
    } catch (error) {
      console.error('Error getting user by id:', error);
      throw error;
    }
  },
  
  async getUserByProviderId(provider, providerId) {
    // Create scan command to find users by provider and providerId
    const command = new ScanCommand({
      TableName: "Users",
      FilterExpression: "provider = :provider AND providerId = :providerId",
      ExpressionAttributeValues: {
        ":provider": provider,
        ":providerId": providerId
      }
    });
    
    try {
      const result = await docClient.send(command);
      return result.Items && result.Items.length > 0 ? result.Items[0] : null;
    } catch (error) {
      console.error('Error getting user by provider id:', error);
      throw error;
    }
  },

  async createUser(user) {
    // Generate a unique ID if not provided
    if (!user.id) {
      user.id = `user_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }
    
    // Add createdAt timestamp
    user.createdAt = new Date().toISOString();
    
    const command = new PutCommand({
      TableName: "Users",
      Item: user,
      ConditionExpression: "attribute_not_exists(id)"
    });
    
    try {
      await docClient.send(command);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(id, updates) {
    // Build the update expression and attribute values
    let updateExpression = "set ";
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    Object.keys(updates).forEach((key, index) => {
      const attrName = `#attr${index}`;
      const attrValue = `:value${index}`;
      updateExpression += `${index !== 0 ? ', ' : ''}${attrName} = ${attrValue}`;
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = updates[key];
    });
    
    // Add updatedAt timestamp
    updateExpression += ', #updatedAt = :updatedAt';
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    
    const command = new UpdateCommand({
      TableName: "Users",
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW"
    });
    
    try {
      const result = await docClient.send(command);
      return result.Attributes;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Project operations
  async createProject(project) {
    // Generate a unique ID if not provided
    if (!project.id) {
      project.id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }
    
    // Add createdAt timestamp
    project.createdAt = new Date().toISOString();
    
    const command = new PutCommand({
      TableName: "Projects",
      Item: project
    });
    
    try {
      await docClient.send(command);
      return project;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  },

  async getProjectById(id) {
    const command = new GetCommand({
      TableName: "Projects",
      Key: { id }
    });
    
    try {
      const result = await docClient.send(command);
      return result.Item;
    } catch (error) {
      console.error('Error getting project by id:', error);
      throw error;
    }
  },

  async getProjectsByClientId(clientId) {
    const command = new QueryCommand({
      TableName: "Projects",
      IndexName: "ClientIndex",
      KeyConditionExpression: "clientId = :clientId",
      ExpressionAttributeValues: {
        ":clientId": clientId
      }
    });
    
    try {
      const result = await docClient.send(command);
      return result.Items || [];
    } catch (error) {
      console.error('Error getting projects by clientId:', error);
      throw error;
    }
  },

  async getProjectsByCreatorId(creatorId) {
    const command = new QueryCommand({
      TableName: "Projects",
      IndexName: "CreatorIndex",
      KeyConditionExpression: "creatorId = :creatorId",
      ExpressionAttributeValues: {
        ":creatorId": creatorId
      }
    });
    
    try {
      const result = await docClient.send(command);
      return result.Items || [];
    } catch (error) {
      console.error('Error getting projects by creatorId:', error);
      throw error;
    }
  },

  // Submission operations
  async createSubmission(submission) {
    // Generate a unique ID if not provided
    if (!submission.id) {
      submission.id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }
    
    // Add createdAt timestamp
    submission.createdAt = new Date().toISOString();
    
    const command = new PutCommand({
      TableName: "Submissions",
      Item: submission
    });
    
    try {
      await docClient.send(command);
      return submission;
    } catch (error) {
      console.error('Error creating submission:', error);
      throw error;
    }
  },

  async getSubmissionsByProjectId(projectId) {
    const command = new QueryCommand({
      TableName: "Submissions",
      IndexName: "ProjectIndex",
      KeyConditionExpression: "projectId = :projectId",
      ExpressionAttributeValues: {
        ":projectId": projectId
      }
    });
    
    try {
      const result = await docClient.send(command);
      return result.Items || [];
    } catch (error) {
      console.error('Error getting submissions by projectId:', error);
      throw error;
    }
  },

  // Initialize tables - for development/testing
  async initializeTables() {
    const AWS = require('aws-sdk');
    
    // Only use local endpoint in development
    const dynamoConfig = {
      region: process.env.AWS_REGION || 'us-east-1'
    };
    
    if (process.env.NODE_ENV === 'development' && process.env.DYNAMODB_ENDPOINT) {
      dynamoConfig.endpoint = process.env.DYNAMODB_ENDPOINT;
      dynamoConfig.credentials = {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'local',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'local'
      };
    }
    
    const dynamodb = new AWS.DynamoDB(dynamoConfig);
    
    try {
      // Users table
      await dynamodb.createTable({
        TableName: "Users",
        KeySchema: [
          { AttributeName: "id", KeyType: "HASH" }
        ],
        AttributeDefinitions: [
          { AttributeName: "id", AttributeType: "S" },
          { AttributeName: "email", AttributeType: "S" }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "EmailIndex",
            KeySchema: [
              { AttributeName: "email", KeyType: "HASH" }
            ],
            Projection: { ProjectionType: "ALL" },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5
            }
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }).promise();
      console.log("Users table created");
      
      // Projects table
      await dynamodb.createTable({
        TableName: "Projects",
        KeySchema: [
          { AttributeName: "id", KeyType: "HASH" }
        ],
        AttributeDefinitions: [
          { AttributeName: "id", AttributeType: "S" },
          { AttributeName: "clientId", AttributeType: "S" },
          { AttributeName: "creatorId", AttributeType: "S" }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "ClientIndex",
            KeySchema: [
              { AttributeName: "clientId", KeyType: "HASH" }
            ],
            Projection: { ProjectionType: "ALL" },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5
            }
          },
          {
            IndexName: "CreatorIndex",
            KeySchema: [
              { AttributeName: "creatorId", KeyType: "HASH" }
            ],
            Projection: { ProjectionType: "ALL" },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5
            }
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }).promise();
      console.log("Projects table created");
      
      // Submissions table
      await dynamodb.createTable({
        TableName: "Submissions",
        KeySchema: [
          { AttributeName: "id", KeyType: "HASH" }
        ],
        AttributeDefinitions: [
          { AttributeName: "id", AttributeType: "S" },
          { AttributeName: "projectId", AttributeType: "S" }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: "ProjectIndex",
            KeySchema: [
              { AttributeName: "projectId", KeyType: "HASH" }
            ],
            Projection: { ProjectionType: "ALL" },
            ProvisionedThroughput: {
              ReadCapacityUnits: 5,
              WriteCapacityUnits: 5
            }
          }
        ],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5
        }
      }).promise();
      console.log("Submissions table created");
      
      return true;
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.log("Tables already exist, skipping creation");
        return true;
      }
      console.error("Error initializing DynamoDB tables:", error);
      throw error;
    }
  }
};

module.exports = db;