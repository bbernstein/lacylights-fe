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

```bash
npm run build
npm start
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is part of the LacyLights theatre lighting control system.