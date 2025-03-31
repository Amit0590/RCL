# Content Creation Website: Developer Documentation

This document provides detailed information for developers working on the Content Creation Website project. It covers architecture, setup procedures, coding standards, and best practices.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Environment Setup](#environment-setup)
3. [Authentication System](#authentication-system)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [Frontend Components](#frontend-components)
7. [Testing Guidelines](#testing-guidelines)
8. [Deployment Process](#deployment-process)
9. [Security Considerations](#security-considerations)
10. [Troubleshooting](#troubleshooting)

## Architecture Overview

The Content Creation Website follows a client-server architecture:

### Backend Architecture
- **Framework**: Express.js on Node.js
- **Authentication**: Passport.js with local and OAuth strategies
- **Database**: SQLite for development, PostgreSQL for production
- **API Structure**: RESTful API endpoints for all resources

### Frontend Architecture
- **Structure**: HTML5, CSS3, and vanilla JavaScript
- **Templates**: Server-side rendering with some client-side interactivity
- **Assets**: Organized in separate directories for CSS, JS, and images
- **Responsiveness**: Mobile-first approach using CSS media queries

### Data Flow
1. Client sends a request to the server
2. Express routes handle the request
3. Authentication middleware validates user session if required
4. Controller logic processes the request
5. Database queries are executed
6. Response is sent back to the client

## Environment Setup

### Local Development Environment

1. **Clone the repository**
   ```
   git clone https://github.com/Amit0590/ContentCreationWebsite.git
   cd ContentCreationWebsite
   ```

2. **Install dependencies**
   ```
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```
   # Server configuration
   PORT=3000
   NODE_ENV=development
   
   # Database configuration (development)
   DB_PATH=./users.db
   
   # Session secret
   SESSION_SECRET=your_session_secret_key
   
   # OAuth credentials
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   TWITTER_API_KEY=your_twitter_api_key
   TWITTER_API_SECRET=your_twitter_api_secret
   
   # Base URL for callbacks
   BASE_URL=http://localhost:3000
   ```

4. **Initialize the database**
   ```
   npm run init-db
   ```

5. **Start the development server**
   ```
   npm run dev
   ```

### Required Software

- Node.js v14.x or higher
- npm v6.x or higher
- Git
- Text editor or IDE (VSCode recommended)
- SQLite browser (optional, for database inspection)

## Authentication System

The application uses Passport.js for authentication, supporting both traditional email/password authentication and OAuth providers.

### Authentication Strategies

1. **Local Strategy**: Email and password
   - Passwords are hashed using bcrypt
   - User credentials stored in the database

2. **OAuth Strategies**: 
   - Google OAuth2
   - Facebook OAuth
   - Twitter OAuth

### Authentication Flow

#### Local Authentication:
1. User submits email and password
2. Server validates credentials
3. If valid, a session is created
4. Session ID is stored in a cookie

#### OAuth Authentication:
1. User clicks on OAuth provider button
2. User is redirected to provider's login page
3. User approves the application's access request
4. Provider redirects back with authorization code
5. Server exchanges code for access token
6. Server retrieves user information using the token
7. User is either logged in or prompted to register

### Session Management

- Sessions are stored in memory for development
- For production, consider using a persistent store like Redis
- Session expiration is set to 24 hours

### Authentication Configuration

The authentication setup is defined in `config/passport-setup.js`, which initializes all the authentication strategies.

## Database Schema

The application uses an SQLite database for development with the following schema:

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    name TEXT,
    profile_type TEXT,  -- 'creator' or 'client'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    auth_provider TEXT,  -- 'local', 'google', 'facebook', 'twitter'
    auth_id TEXT,        -- Provider's user ID
    profile_image TEXT,
    bio TEXT
);
```

### Projects Table
```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    client_id INTEGER,
    creator_id INTEGER,
    status TEXT,        -- 'pending', 'in-progress', 'review', 'completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deadline TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES users (id),
    FOREIGN KEY (creator_id) REFERENCES users (id)
);
```

### Content Submissions Table
```sql
CREATE TABLE content_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER,
    content TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT,        -- 'submitted', 'approved', 'needs-revision'
    feedback TEXT,
    FOREIGN KEY (project_id) REFERENCES projects (id)
);
```

### Database Access

The database is accessed through a simple abstraction layer defined in `db/db.js`, which provides methods for common operations.

## API Documentation

The API follows RESTful principles. All endpoints are prefixed with `/api`.

### Authentication Endpoints

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Log in a user
- `GET /api/auth/logout`: Log out the current user
- `GET /api/auth/google`: Initiate Google OAuth flow
- `GET /api/auth/google/callback`: Google OAuth callback
- `GET /api/auth/facebook`: Initiate Facebook OAuth flow
- `GET /api/auth/facebook/callback`: Facebook OAuth callback
- `GET /api/auth/twitter`: Initiate Twitter OAuth flow
- `GET /api/auth/twitter/callback`: Twitter OAuth callback

### User Endpoints

- `GET /api/users/me`: Get the current user's profile
- `PUT /api/users/me`: Update the current user's profile
- `GET /api/users/:id`: Get a user's public profile
- `GET /api/users`: Get a list of users (with filters)

### Project Endpoints

- `GET /api/projects`: Get a list of projects
- `POST /api/projects`: Create a new project
- `GET /api/projects/:id`: Get a project's details
- `PUT /api/projects/:id`: Update a project
- `DELETE /api/projects/:id`: Delete a project

### Content Submission Endpoints

- `GET /api/projects/:id/submissions`: Get submissions for a project
- `POST /api/projects/:id/submissions`: Create a submission
- `PUT /api/projects/:id/submissions/:submissionId`: Update a submission
- `POST /api/projects/:id/submissions/:submissionId/feedback`: Add feedback

## Frontend Components

### Page Structure

1. **Landing Page (`index.html`)**
   - Showcases the platform's features
   - Provides calls to action for signup and login

2. **Authentication Pages**
   - Login (`login.html`)
   - Signup (`signup.html`)
   - Forgot Password (`forgot-password.html`)
   - Authentication Success (`auth-success.html`)

3. **Dashboard (`dashboard.html`)**
   - Displays active projects
   - Shows notifications
   - Provides quick access to common actions

4. **Profile Page (`profile.html`)**
   - Displays user information
   - Portfolio showcase for creators
   - Project history for clients and creators

### JavaScript Modules

- `main.js`: General website functionality
- `profile.js`: Profile page specific functionality

### CSS Structure

The CSS follows a component-based approach, with all styles in `css/styles.css`. Consider refactoring into separate files for larger projects.

## Testing Guidelines

### Unit Testing

For unit tests, we use Jest:
```
npm run test:unit
```

Test files should be placed in a `__tests__` directory adjacent to the code being tested.

### Integration Testing

For integration tests, we use Supertest with Jest:
```
npm run test:integration
```

Integration tests are stored in the `tests/integration` directory.

### End-to-End Testing

For E2E tests, we use Cypress:
```
npm run test:e2e
```

E2E tests are stored in the `cypress/integration` directory.

## Deployment Process

### Prerequisites

- Node.js hosting environment
- PostgreSQL database
- Environment variables configured

### Deployment Steps

1. **Build for production**
   ```
   npm run build
   ```

2. **Set up environment variables on the server**
   - All the same variables as in the `.env` file
   - Set `NODE_ENV=production`
   - Configure production-specific database connection

3. **Database migration**
   ```
   npm run migrate
   ```

4. **Start the application**
   ```
   npm start
   ```

### CI/CD Pipeline

The project uses GitHub Actions for CI/CD:
- On push to `main`: Run tests
- On release tag: Deploy to production

## Security Considerations

### Authentication

- HTTPS should be enforced in production
- OAuth secrets must be stored securely
- Session cookies should have the `secure` and `httpOnly` flags

### Data Protection

- Input validation on all forms
- Query parameters should be sanitized to prevent SQL injection
- XSS protection through proper output escaping

### API Security

- Rate limiting to prevent abuse
- CORS configuration to restrict access to trusted origins
- Authentication required for sensitive endpoints

## Troubleshooting

### Common Issues

1. **OAuth Authentication Failures**
   - Check that OAuth credentials are correctly set up
   - Verify that callback URLs match exactly what's configured in the provider's dashboard

2. **Database Connection Issues**
   - Ensure the database file exists for SQLite
   - Check connection parameters for PostgreSQL
   - Verify that the schema is up to date

3. **Session Expiration Problems**
   - Check session configuration
   - Ensure cookies are being properly set

### Debugging

- Use the `DEBUG` environment variable for verbose logging:
  ```
  DEBUG=app:* npm run dev
  ```

- Check server logs for errors:
  ```
  npm run logs
  ```

### Getting Help

- Consult the project wiki
- Review existing GitHub issues
- Contact the maintainers through the GitHub repository