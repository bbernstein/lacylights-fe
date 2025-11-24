<p align="center">
  <img src="resources/lacylights-logo-square.png" alt="LacyLights Logo" width="200"/>
</p>

# LacyLights Frontend

A Next.js-based web frontend for the LacyLights theatre lighting control system.

## Features

- Real-time lighting control interface
- Fixture management and patching
- Scene creation and editing
- Cue list sequencing
- Live DMX monitoring
- GraphQL API integration with subscriptions

## Prerequisites

- Node.js 18+ 
- npm or yarn
- LacyLights backend server running on port 4000

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/lacylights-fe.git
cd lacylights-fe
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing Static Export Locally

To test the production static export behavior locally (recommended before deploying to Raspberry Pi):

```bash
npm run dev:static
```

This builds the static export and serves it with a server that mimics the nginx routing used in production. This is crucial for testing routing behavior since `npm run dev` uses the Next.js dev server which handles routes differently than the static export.

📖 **See [STATIC_TESTING.md](./STATIC_TESTING.md) for complete documentation.**

## Development

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **API Client**: Apollo Client
- **State Management**: Apollo Client cache + React state
- **Real-time**: GraphQL subscriptions over WebSocket

### Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # Reusable UI components
├── hooks/           # Custom React hooks
├── lib/             # Library configurations (Apollo, etc.)
└── types/           # TypeScript type definitions
```

### Key Components (To Be Implemented)

- **Project Dashboard**: Overview of all lighting projects
- **Fixture Manager**: Add, edit, and patch fixtures
- **Scene Editor**: Visual scene creation with channel controls
- **Cue List Editor**: Sequential cue programming
- **Live View**: Real-time DMX output monitoring
- **Channel Grid**: Grid-based channel value editing

## API Integration

The frontend connects to the LacyLights GraphQL API at `http://localhost:4000/graphql` by default. 

Key GraphQL operations:
- Query projects, fixtures, scenes, and cue lists
- Mutate to create/update/delete resources
- Subscribe to real-time DMX output changes

## Building for Production

LacyLights Frontend supports **two deployment modes**, each with its own build process and distribution artifact:

### 1. Static Export (for Raspberry Pi)

Build a static export for deployment on Raspberry Pi with nginx:

```bash
npm run build:static
```

This generates a static site in the `out/` directory optimized for nginx deployment. The static export:
- Contains no Node.js server components
- Serves pre-rendered HTML/CSS/JS files
- Uses client-side API calls to backend
- Deployed via `lacylights-fe-static` artifact

For complete Raspberry Pi deployment instructions, see:
📖 **[Raspberry Pi Deployment Guide](https://github.com/bbernstein/lacylights-node/blob/main/deploy/DEPLOYMENT.md)**

### 2. Server Mode (for Mac Application)

Build a full Next.js server for the Mac desktop application:

```bash
npm run build
npm start
```

This creates a production Next.js server that:
- Runs as a Node.js application
- Supports API routes and server components
- Bundled with the Mac desktop app
- Deployed via `lacylights-fe-server` artifact

## Releases and Versioning

### Version Format

LacyLights Frontend uses semantic versioning with beta support:

- **Stable Release**: `X.Y.Z` (e.g., `0.7.2`, `1.0.0`)
- **Beta Release**: `X.Y.ZbN` (e.g., `0.7.3b1`, `0.7.3b2`)

Beta releases are marked as "Pre-release" on GitHub and are used for testing new features before stable release.

### Automated Releases

Releases are created automatically via GitHub Actions workflow. The workflow:
- Handles version bumping (major, minor, patch)
- Manages beta version sequences
- Builds **both** static and server artifacts
- Uploads to S3 distribution (`dist.lacylights.com`)
- Updates DynamoDB for version tracking
- Creates GitHub Release with artifacts

### Installation

**Download Latest Release:**

- **Static Build (RPi)**: https://dist.lacylights.com/releases/fe-static/latest.json
- **Server Build (Mac)**: https://dist.lacylights.com/releases/fe-server/latest.json

**Manual Installation:**

```bash
# For Raspberry Pi (static export)
wget https://dist.lacylights.com/releases/fe-static/lacylights-fe-static-v[VERSION].tar.gz
tar -xzf lacylights-fe-static-v[VERSION].tar.gz
# Deploy to nginx

# For Mac (server mode)
wget https://dist.lacylights.com/releases/fe-server/lacylights-fe-server-v[VERSION].tar.gz
tar -xzf lacylights-fe-server-v[VERSION].tar.gz
cd lacylights-fe-server
npm start
```

**For complete release process documentation**, see:
📖 **[RELEASE_PROCESS.md](./RELEASE_PROCESS.md)**

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is part of the LacyLights theatre lighting control system.