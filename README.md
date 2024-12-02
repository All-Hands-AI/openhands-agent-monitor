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

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Required: GitHub Personal Access Token
VITE_GITHUB_TOKEN=your_github_token_here

# Optional: Use cache to reduce GitHub API calls (default: true)
VITE_USE_CACHE=true
```

Note: Never commit your `.env` file to version control. The `.gitignore` file already includes it.

## Caching Mechanism

To reduce the number of GitHub API calls and improve loading times, the application includes a caching system:

1. **Building the Cache**
   ```bash
   npm run build:cache
   ```
   This creates a cache of GitHub API responses in the `.cache` directory. The cache is valid for 24 hours.

2. **Using the Cache**
   - Set `VITE_USE_CACHE=true` in your `.env` file (default setting)
   - When enabled, the app will:
     - Check for a valid cache first
     - Use cached data if available and less than 24 hours old
     - Fall back to live GitHub API calls if cache is missing or expired

3. **Disabling the Cache**
   - Set `VITE_USE_CACHE=false` in your `.env` file
   - This will always use live GitHub API calls

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

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:5173`

## Testing

Run the test suite:
```bash
# Run tests in watch mode
npm run test

# Run tests with coverage report
npm run test:coverage
```

## Building for Production

1. Create a production build:
```bash
npm run build
```

2. Preview the production build locally:
```bash
npm run preview
```

The production build will be in the `dist` directory.

## Deployment

### Vercel Deployment (Recommended)

1. Install the Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy to Vercel:
```bash
vercel
```

3. Set up the required environment variables in your Vercel project settings:
   - `VITE_GITHUB_TOKEN`: Your GitHub Personal Access Token
   - `CRON_SECRET`: A secure random string for authenticating cron jobs
   - `VITE_USE_CACHE`: Set to "true" to enable caching (recommended)

4. The cache will be built automatically:
   - During deployment (as part of the build process)
   - Every 6 hours via Vercel Cron Jobs
   - On-demand through the `/api/rebuild-cache` endpoint (requires CRON_SECRET)

### Other Static Hosting (e.g., GitHub Pages, Netlify)

1. Build the application:
```bash
npm run build
```

2. Deploy the contents of the `dist` directory to your hosting provider.

3. Make sure to set the `VITE_GITHUB_TOKEN` environment variable in your hosting provider's configuration.

Note: Cache rebuilding is not available with static hosting. You'll need to either disable caching or rebuild manually.

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t openhands-monitor .
```

2. Run the container:
```bash
docker run -p 8080:80 -e VITE_GITHUB_TOKEN=your_token_here -e VITE_USE_CACHE=true openhands-monitor
```

The app will be available at `http://localhost:8080`.

Note: Cache rebuilding is not available with Docker deployment. You'll need to either disable caching or rebuild manually.

## Configuration

The application is configured to monitor the OpenHands repository by default. To monitor a different repository, modify the following constants in `src/services/github.ts`:

```typescript
const REPO_OWNER = 'your-org-name';
const REPO_NAME = 'your-repo-name';
```

## Troubleshooting

### Common Issues

1. **API Rate Limiting**
   - Symptom: Error message about rate limiting
   - Solution: Use a GitHub token with appropriate permissions

2. **Loading Forever**
   - Symptom: Spinner never stops
   - Solution: Check browser console for errors and verify GitHub token

3. **No Data Showing**
   - Symptom: Empty activity list
   - Solution: Verify date range filter settings and check repository configuration

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
