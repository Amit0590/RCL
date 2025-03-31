/**
 * Seed script to create a test user in DynamoDB
 * Run this script to ensure there's at least one user in the database for testing
 */

// Set environment variables manually for local execution
process.env.AWS_ACCESS_KEY_ID = 'local';
process.env.AWS_SECRET_ACCESS_KEY = 'local';
process.env.AWS_REGION = 'us-east-1';
process.env.DYNAMODB_ENDPOINT = 'http://localhost:8000';

const bcrypt = require('bcryptjs');
const dynamoDB = require('./dynamodb');

async function seedTestUser() {
  try {
    console.log('Checking if test user exists...');
    
    // Check if test user already exists
    const existingUser = await dynamoDB.getUserByEmail('test@example.com');
    
    if (existingUser) {
      console.log('Test user already exists!', existingUser.id);
      return;
    }
    
    // Create test user if doesn't exist
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: hashedPassword,
      company: 'Test Company',
      provider: 'local'
    };
    
    console.log('Creating test user...');
    const newUser = await dynamoDB.createUser(testUser);
    
    console.log('Test user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    console.log('User ID:', newUser.id);
    
    return newUser;
  } catch (error) {
    console.error('Error seeding test user:', error);
  }
}

// Run the seed function
(async () => {
  try {
    console.log('Initializing tables...');
    // Initialize tables first
    await dynamoDB.initializeTables();
    console.log('Tables initialized.');
    
    // Then seed test user
    await seedTestUser();
    
    console.log('Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
})();