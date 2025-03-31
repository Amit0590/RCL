# AWS Cloud DynamoDB Migration Guide

This guide explains how to migrate your Content Creation Website from local DynamoDB to AWS Cloud DynamoDB.

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI installed and configured
3. IAM User with DynamoDB permissions

## Step 1: Create IAM User with DynamoDB Access

1. Log in to the AWS Console
2. Go to IAM service
3. Create a new IAM user with programmatic access
4. Attach the `AmazonDynamoDBFullAccess` policy to this user
5. Save the Access Key ID and Secret Access Key

## Step 2: Update Environment Variables

Update your `.env` file with your AWS credentials:

```
# AWS Configuration
AWS_REGION=your-aws-region           # e.g., us-east-1, us-west-2
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
```

Remove or comment out the `DYNAMODB_ENDPOINT` variable:
```
# DYNAMODB_ENDPOINT=http://dynamodb-local:8000
```

## Step 3: Create DynamoDB Tables in AWS Cloud

The application will automatically create the required DynamoDB tables in your AWS account when it first runs. However, you can also create them manually using the AWS Console if you prefer.

Required tables:
- Users
- Projects
- Submissions

## Step 4: Migrate Existing Data

Run the migration script to copy your existing data from local DynamoDB to AWS Cloud:

```bash
node migrate-to-aws.js
```

This script will:
1. Connect to your local DynamoDB
2. Read all data from the local tables
3. Create the tables in AWS Cloud DynamoDB if they don't exist
4. Insert the data into the AWS Cloud DynamoDB tables

## Step 5: Update Docker Configuration

The docker-compose.yml and Dockerfile have been updated to use AWS Cloud DynamoDB instead of local DynamoDB.

Key changes:
- Removed the dynamodb-local service from docker-compose.yml
- Updated environment variables to pass AWS credentials
- Set NODE_ENV to production

## Step 6: Deploy and Test

1. Rebuild your Docker containers:
   ```bash
   docker-compose down
   docker-compose build
   docker-compose up -d
   ```

2. Test the application to ensure it connects to AWS Cloud DynamoDB correctly

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Verify your AWS credentials are correct
2. Check that the IAM user has the necessary permissions
3. Confirm your AWS region is set correctly
4. Check your network configuration to ensure your application can reach AWS services

### Data Migration Issues

If the data migration fails:

1. Check the error messages for specific issues
2. Verify that your local DynamoDB service is running and accessible
3. Ensure your AWS credentials have permissions to create and write to DynamoDB tables

## Production Considerations

For production deployments, consider the following:

1. **Security**: Store AWS credentials securely, never commit them to version control
2. **Cost Management**: Set up billing alerts for DynamoDB usage
3. **Backup Strategy**: Enable point-in-time recovery for your DynamoDB tables
4. **Scaling**: Monitor table performance and adjust capacity as needed
5. **Regional Selection**: Choose an AWS region that is geographically close to your users

## Additional Resources

- [AWS DynamoDB Documentation](https://docs.aws.amazon.com/dynamodb/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)