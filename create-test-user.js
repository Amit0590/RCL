/**
 * Script to create a test user inside the Docker container
 */
const bcrypt = require('bcryptjs');

async function createTestUser() {
  try {
    // Import dynamoDB module
    const dynamoDB = require('./ContentCreationWebsite/db/dynamodb');
    
    console.log('Creating test user in DynamoDB...');
    
    // Hash the password
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create test user
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: hashedPassword,
      company: 'Test Company',
      provider: 'local'
    };
    
    // Check if user already exists
    const existingUser = await dynamoDB.getUserByEmail('test@example.com');
    if (existingUser) {
      console.log('Test user already exists with ID:', existingUser.id);
      console.log('You can login with:');
      console.log('Email: test@example.com');
      console.log('Password: password123');
      return;
    }
    
    // Create the user
    const newUser = await dynamoDB.createUser(testUser);
    
    console.log('Test user created successfully!');
    console.log('User ID:', newUser.id);
    console.log('You can login with:');
    console.log('Email: test@example.com');
    console.log('Password: password123');
    
  } catch (error) {
    console.error('Error creating test user:', error);
  }
}

// Run the function
createTestUser();