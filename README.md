# OpenHands Bot Activity Monitor

A web application to monitor and visualize the activity of the OpenHands GitHub bot.

## Features

### 1. Activity Listing
- Lists all attempted issue resolutions and PR modifications
- Entries are sorted by date
- Each entry shows:
  - Type (Issue/PR)
  - Status (Success/Failure)
  - Timestamp
  - Link to the relevant GitHub item
  - Description of the action taken

### 2. Filtering Capabilities
- Filter activities by:
  - Type (Issue resolution or PR modification)
  - Status (Success or Failure)
  - Date range

### 3. Visualization
- Stacked line charts implemented using Vega-Lite showing:
  - Issue resolutions over time (successes vs failures)
  - PR modifications over time (successes vs failures)
  - Time-based trends in bot activity

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- A GitHub Personal Access Token with the following permissions:
  - `repo` scope for accessing repository data
  - `read:org` scope if monitoring repositories in an organization

## GitHub Token Configuration

The bot requires a GitHub Personal Access Token (PAT) to function properly. Here's how to set it up:

1. Create a new GitHub PAT:
   - Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
   - Click "Generate new token (classic)"
   - Give it a descriptive name (e.g., "OpenHands Bot Token")
   - Select the required scopes:
     - `repo` (full control of private repositories)
     - `read:org` (if monitoring organization repositories)
   - Click "Generate token"
   - Copy the token immediately (you won't see it again)

2. Configure the token:
   - For local development:
     ```bash
     # Create/edit .env file
     echo "GITHUB_TOKEN=your_token_here" > .env
     echo "VITE_GITHUB_TOKEN=your_token_here" >> .env
     ```
   - For production:
     - Set `GITHUB_TOKEN` in your CI/CD environment
     - Set `VITE_GITHUB_TOKEN` in your hosting environment

3. Token Security:
   - Never commit the token to version control
   - Use environment variables in CI/CD pipelines
   - Rotate tokens periodically
   - Use repository-specific tokens when possible
   - Consider using GitHub Apps for production deployments

4. Verify token setup:
   ```bash
   # Test token configuration
   npm run test:integration
   ```

## Environment Variables

The application uses environment variables for configuration:

### Build Time
- `GITHUB_TOKEN` - GitHub Personal Access Token (required for cache generation)
  - Required scopes: `repo` for repository access, `read:org` for organization repositories
  - Only needed during cache generation, not at runtime

You can set this in a `.env` file for local development:
```env
GITHUB_TOKEN=your_github_token_here
```

Note: Never commit your `.env` file to version control. The `.gitignore` file already includes it.

## Installation

1. Clone the repository:
```bash
git clone https://github.com/All-Hands-AI/openhands-agent-monitor.git
cd openhands-agent-monitor
```

2. Install dependencies:
```bash
npm install
```

## Development

1. Generate the data cache:
```bash
# Make sure GITHUB_TOKEN is set in your .env file
npm run build:cache
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

Note: The cache is static during development. Run `npm run build:cache` again to refresh the data.

## Testing

Run the test suite:
```bash
# Run tests in watch mode
npm run test

# Run tests with coverage report
npm run test:coverage
```

## Building and Deployment

The application uses a caching mechanism to improve performance and security. Instead of making GitHub API calls from the frontend, the data is pre-fetched and cached during the build process.

### Build Commands

- `npm run build` - Build the frontend application only
- `npm run build:cache` - Generate the GitHub data cache
- `npm run build:all` - Generate cache and build the application

### Deployment Process

1. Set up environment:
   ```bash
   # Clone repository and install dependencies
   git clone https://github.com/All-Hands-AI/openhands-agent-monitor.git
   cd openhands-agent-monitor
   npm install
   ```

2. Generate cache and build:
   ```bash
   # Set GitHub token for cache generation
   export GITHUB_TOKEN=your_github_token_here

   # Generate cache and build application
   npm run build:all
   ```

3. Deploy the `dist` directory to your hosting provider.

Note: The GitHub token is only needed during the build process to generate the cache. The frontend application reads from this cache and does not need the token at runtime.

### Static Hosting (e.g., GitHub Pages, Netlify)

1. Set up deployment:
   ```bash
   # Add build command in your hosting provider
   npm run build

   # Add cache generation to your build pipeline
   npm run build:cache
   ```

2. Configure environment variables:
   - Set `GITHUB_TOKEN` in your CI/CD environment
   - No environment variables needed in the hosting environment

### Docker Deployment

1. Build the Docker image:
   ```bash
   # Build with cache generation
   docker build --build-arg GITHUB_TOKEN=your_token_here -t openhands-monitor .
   ```

2. Run the container:
   ```bash
   # No token needed at runtime
   docker run -p 8080:80 openhands-monitor
   ```

The app will be available at `http://localhost:8080`.

## Configuration

The application is configured to monitor the OpenHands repository by default. To monitor a different repository, modify the following constants in `src/services/github.ts`:

```typescript
const REPO_OWNER = 'your-org-name';
const REPO_NAME = 'your-repo-name';
```

## Troubleshooting

### Common Issues

1. **Cache Generation Fails**
   - Symptom: Error during `npm run build:cache`
   - Solution: 
     - Verify `GITHUB_TOKEN` is set and has correct permissions
     - Check for GitHub API rate limiting
     - Ensure repository configuration is correct

2. **No Data Showing**
   - Symptom: Empty activity list
   - Solution: 
     - Verify cache was generated successfully
     - Check date range filter settings
     - Run `npm run build:cache` to refresh data

3. **Development Server Shows Old Data**
   - Symptom: Changes in GitHub not reflected
   - Solution: Run `npm run build:cache` to update the cache

### Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Verify environment variables are set correctly
3. Ensure GitHub token has required permissions
4. Open an issue in the repository with:
   - Description of the problem
   - Steps to reproduce
   - Error messages (if any)
   - Environment details (OS, browser, Node.js version)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write or update tests
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
```
