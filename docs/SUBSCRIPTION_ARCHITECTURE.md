# Real-time Cue List Synchronization Architecture

## Overview

The real-time cue list synchronization feature enables multiple clients to stay synchronized during lighting cue playback using GraphQL subscriptions over WebSocket connections.

## Architecture

### Frontend Components

#### `useCueListPlayback` Hook
- Custom React hook managing GraphQL subscription lifecycle
- Automatically subscribes/unsubscribes based on `cueListId`
- Handles connection errors and cleanup
- Provides real-time playback status updates

#### `CueListUnifiedView` Integration
- Implements optimistic UI updates for immediate feedback
- Subscribes to real-time playback status via `useCueListPlayback`
- Allows subscription data to override local state when available
- Maintains responsive UI even during WebSocket delays

### Backend Services

#### `PlaybackStateService`
- Singleton service managing playback state across all cue lists
- Tracks fade progress with 100ms interval updates
- Handles automatic follow-time execution for sequential cues
- Emits events via GraphQL PubSub for real-time updates

#### GraphQL Integration
- `CueListPlaybackStatus` subscription type with cue list filtering
- Enhanced `playCue` mutation to emit state change events
- Proper type safety with null/undefined handling

## State Management Pattern

### Optimistic Updates
```typescript
// Always set local state immediately for UI responsiveness
setCurrentCueIndex(index);
setIsPlaying(true);

// Subscription data overrides local state when available
useEffect(() => {
  if (playbackStatus) {
    setCurrentCueIndex(playbackStatus.currentCueIndex ?? -1);
    setIsPlaying(playbackStatus.isPlaying);
    setFadeProgress(playbackStatus.fadeProgress ?? 0);
  }
}, [playbackStatus]);
```

### Type Consistency
- Backend: `currentCueIndex: number | null` (null = no active cue)
- Frontend: `currentCueIndex: number` (-1 = no active cue)
- Explicit conversion ensures consistent local state representation

## Benefits

1. **Real-time Sync**: Multiple clients see the same playback state instantly
2. **Responsive UI**: Optimistic updates provide immediate feedback
3. **Fault Tolerance**: Local state fallback when WebSocket disconnects
4. **Type Safety**: Proper handling of null values and type conversions
5. **Performance**: Efficient subscription filtering by cue list ID

## Usage

The synchronization is automatic when using `CueListUnifiedView`. Multiple clients opening the same cue list will automatically stay synchronized during playback operations.