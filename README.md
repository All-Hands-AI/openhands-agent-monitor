# OpenHands Agent Monitor

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
- Filter by activity type:
  - Issue resolutions
  - PR modifications
- Filter by outcome:
  - Successful attempts
  - Failed attempts

### 3. Visualization
- Stacked line charts showing activity over time
- Separate charts for:
  - Issue resolutions (successful vs failed attempts)
  - PR modifications (successful vs failed attempts)
- Implemented using Vega-Lite for interactive visualization

## Technical Stack
- Vite for build tooling and development environment
- React for UI components
- TypeScript for type safety
- Vitest for testing
- Vega-Lite for data visualization

## Development
(Instructions for setup and development will be added as the project progresses)