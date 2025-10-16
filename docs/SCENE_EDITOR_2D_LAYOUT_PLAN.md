# Scene Editor 2D Layout - Implementation Plan

## Overview

Transform the scene editor from a modal popup into a dedicated page with two editing modes:
1. **Channel List Mode** (existing) - Traditional channel-by-channel editing
2. **2D Layout Mode** (new) - Visual fixture positioning with multi-select and group controls

## User Story

As a lighting designer, I want to visually arrange my fixtures in a 2D layout that represents their physical positions, so that I can:
- Quickly select and control groups of fixtures based on their location
- Have an intuitive spatial view when programming scenes
- Allow AI to suggest optimal layouts based on my venue description

## Database Schema Changes

### Fixture Model Updates

Add position fields to store normalized 2D coordinates:

```prisma
model Fixture {
  // ... existing fields ...

  // 2D Layout positioning (normalized 0-1 coordinates)
  positionX     Float?  @default(0.5)  // X position (0 = left, 1 = right)
  positionY     Float?  @default(0.5)  // Y position (0 = top, 1 = bottom)

  // Optional: Layout metadata
  layoutRotation Float? @default(0)    // Rotation in degrees (for future use)
  layoutNotes    String? @db.Text      // Designer notes about position

  @@index([projectId, positionX, positionY])
}
```

**Migration Strategy:**
- Existing fixtures default to center (0.5, 0.5)
- First-time layout: AI suggests positions or user arranges manually
- Positions are per-project (shared across all scenes)

## GraphQL API Changes

### New Mutations

```graphql
type Mutation {
  # Update single fixture position
  updateFixturePosition(
    id: ID!
    positionX: Float!
    positionY: Float!
    layoutRotation: Float
    layoutNotes: String
  ): Fixture!

  # Bulk update positions (for AI layout or multi-drag)
  updateFixturePositions(
    updates: [FixturePositionInput!]!
  ): [Fixture!]!

  # AI-suggested layout based on venue description
  generateFixtureLayout(
    projectId: ID!
    venueDescription: String!
  ): [Fixture!]!
}

input FixturePositionInput {
  id: ID!
  positionX: Float!
  positionY: Float!
  layoutRotation: Float
}
```

### Updated Queries

```graphql
type Fixture {
  # ... existing fields ...
  positionX: Float
  positionY: Float
  layoutRotation: Float
  layoutNotes: String
}

type Query {
  # Existing queries return positions automatically
  fixturesByProject(projectId: ID!): [Fixture!]!
}
```

## Frontend Architecture

### Routing Changes

**Current:** `/scenes` → Modal popup for scene editor

**New:**
```
/scenes                           # Scene list page
/scenes/:sceneId/edit             # New dedicated scene editor page
  ?mode=channels                  # Default: channel list view
  ?mode=layout                    # 2D layout view
```

### Component Structure

```
src/app/(main)/scenes/
├── page.tsx                      # Scene list (existing, updated)
├── [sceneId]/
│   └── edit/
│       ├── page.tsx              # Scene editor page (new)
│       ├── SceneEditorLayout.tsx # Layout wrapper with mode switcher
│       ├── ChannelListEditor.tsx # Existing channel editor (refactored)
│       └── Layout2DEditor.tsx    # New 2D layout editor
│
src/components/SceneEditor/       # Shared scene editor components
├── Layout2D/
│   ├── Canvas2D.tsx              # Main canvas with zoom/pan
│   ├── FixtureBox.tsx            # Individual fixture representation
│   ├── SelectionBox.tsx          # Drag-to-select rectangle
│   ├── MultiSelectControls.tsx   # Group control panel
│   └── LayoutToolbar.tsx         # View controls (zoom, grid, etc.)
```

## UI/UX Flow

### 1. Scene List Page Updates

**Current behavior:** Click edit button → Modal opens

**New behavior:** Click edit button → Navigate to `/scenes/:sceneId/edit`

```tsx
// src/app/(main)/scenes/page.tsx
const handleEditScene = (scene: Scene) => {
  router.push(`/scenes/${scene.id}/edit`);
};
```

### 2. Scene Editor Page Layout

```
┌─────────────────────────────────────────────────────┐
│ ← Back to Scenes    [Scene Name]    [Channels|Layout]│
├─────────────────────────────────────────────────────┤
│                                                       │
│  [Current Editor View - Channels or Layout]          │
│                                                       │
│                                                       │
└─────────────────────────────────────────────────────┘
```

**Header Components:**
- Back button (← Back to Scenes)
- Scene name display
- Mode toggle: `[Channels] [Layout]` or tabs
- Save/Cancel buttons (if needed)

### 3. Layout 2D Editor Interface

```
┌─────────────────────────────────────────────────────┐
│ Toolbar: [Grid On/Off] [Snap] [Zoom: 100%] [Reset]  │
├─────────────────────────────────────────────────────┤
│                     Canvas Area                       │
│  ┌─────────────────────────────────────────┐        │
│  │  [Fixture 1]  [Fixture 2]  [Fixture 3]   │        │
│  │                                            │        │
│  │     [Selected Fixtures]                   │        │
│  │                                            │        │
│  │  [Fixture 4]        [Fixture 5]          │        │
│  └─────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────┘

When fixtures selected:
┌─────────────────────────────────────────────────────┐
│ Selected: 3 fixtures                    [Deselect All]│
├─────────────────────────────────────────────────────┤
│ Intensity: [========│-------]  50%                   │
│ Red:       [===│------------]  25%                   │
│ Green:     [========│-------]  50%                   │
│ Blue:      [============│---]  75%                   │
│ Color:     [🎨 #4080BF]                              │
└─────────────────────────────────────────────────────┘
```

## 2D Layout Editor - Detailed Design

### Fixture Representation

Each fixture renders as a box showing:

```tsx
interface FixtureBoxProps {
  fixture: Fixture;
  sceneValues: ChannelValue[];  // Current channel values from scene
  position: { x: number; y: number };  // Normalized 0-1
  isSelected: boolean;
  onSelect: (fixtureId: string) => void;
  onDrag: (fixtureId: string, newX: number, newY: number) => void;
}
```

**Visual representation:**
```
┌─────────────────┐
│ Fixture Name    │ ← Label at top
│                 │
│    #FF8040      │ ← Current color (if RGB fixture)
│                 │
│   ⬤ Selected    │ ← Selection indicator
└─────────────────┘
```

**Color display logic:**
- RGB fixtures: Show current RGB color from scene
- RGBW/RGBA: Show mixed color
- Non-color fixtures: Show intensity as grayscale
- Off fixtures: Show dark/dimmed

### Multi-Select Behavior

**Selection Methods:**

1. **Click**: Select single fixture (Shift+click to add to selection)
2. **Selection Box**: Click and drag to draw rectangle
3. **Keyboard**:
   - Cmd/Ctrl+A: Select all
   - Escape: Deselect all

**Selection Box Implementation:**

```tsx
interface SelectionBox {
  startX: number;   // Normalized 0-1
  startY: number;
  endX: number;
  endY: number;
}

// Fixtures within box are selected
const isFixtureInSelection = (fixture: Fixture, box: SelectionBox) => {
  return (
    fixture.positionX >= Math.min(box.startX, box.endX) &&
    fixture.positionX <= Math.max(box.startX, box.endX) &&
    fixture.positionY >= Math.min(box.startY, box.endY) &&
    fixture.positionY <= Math.max(box.startY, box.endY)
  );
};
```

### Group Control Panel

**Channel Merging Logic:**

When multiple fixtures are selected, create a union of all channels:

```typescript
interface GroupChannel {
  name: string;              // Channel name (e.g., "Red", "Intensity")
  fixtures: string[];        // IDs of fixtures that have this channel
  values: number[];          // Current values for each fixture
  averageValue: number;      // Display value for slider
  hasVariation: boolean;     // Show indicator if values differ
}

const mergeChannels = (selectedFixtures: Fixture[], sceneValues: ChannelValue[]) => {
  const channelMap = new Map<string, GroupChannel>();

  selectedFixtures.forEach(fixture => {
    fixture.channels.forEach(channel => {
      if (!channelMap.has(channel.name)) {
        channelMap.set(channel.name, {
          name: channel.name,
          fixtures: [],
          values: [],
          averageValue: 0,
          hasVariation: false,
        });
      }

      const groupChannel = channelMap.get(channel.name)!;
      groupChannel.fixtures.push(fixture.id);

      const value = sceneValues.find(v => v.channelId === channel.id)?.value || 0;
      groupChannel.values.push(value);
    });
  });

  // Calculate averages and detect variations
  channelMap.forEach(channel => {
    channel.averageValue = channel.values.reduce((a, b) => a + b, 0) / channel.values.length;
    channel.hasVariation = !channel.values.every(v => v === channel.values[0]);
  });

  return Array.from(channelMap.values());
};
```

**Group Control UI:**

```tsx
<div className="group-controls">
  <h3>Selected: {selectedFixtures.length} fixtures</h3>

  {/* Color picker for RGB channels */}
  {hasRGBChannels && (
    <ColorPicker
      value={averageRGBColor}
      onChange={(color) => updateAllSelectedFixtures({ rgb: color })}
    />
  )}

  {/* Individual channel sliders */}
  {groupChannels.map(channel => (
    <ChannelSlider
      key={channel.name}
      label={channel.name}
      value={channel.averageValue}
      hasVariation={channel.hasVariation}  // Show indicator
      onChange={(value) => updateChannel(channel.name, value)}
      affectedFixtures={`${channel.fixtures.length}/${selectedFixtures.length}`}
    />
  ))}
</div>
```

**Update behavior:**
- Slider change: Update all fixtures that have that channel
- Color picker: Update RGB/RGBW channels for all compatible fixtures
- Relative changes: Maintain relative differences between fixtures

## Canvas Implementation

### Pan and Zoom

```tsx
interface CanvasState {
  zoom: number;        // 0.5 to 2.0
  panX: number;        // Pixels
  panY: number;        // Pixels
}

// Mouse wheel zoom
const handleWheel = (e: WheelEvent) => {
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  setZoom(prevZoom => Math.min(Math.max(prevZoom * delta, 0.5), 2.0));
};

// Middle mouse button pan
const handleMouseMove = (e: MouseEvent) => {
  if (e.buttons === 4) {  // Middle button
    setPanX(prev => prev + e.movementX);
    setPanY(prev => prev + e.movementY);
  }
};
```

### Coordinate Conversion

```typescript
// Normalized (0-1) to screen pixels
const normalizedToScreen = (
  normalized: { x: number; y: number },
  canvasSize: { width: number; height: number },
  canvasState: CanvasState
) => {
  return {
    x: normalized.x * canvasSize.width * canvasState.zoom + canvasState.panX,
    y: normalized.y * canvasSize.height * canvasState.zoom + canvasState.panY,
  };
};

// Screen pixels to normalized (0-1)
const screenToNormalized = (
  screen: { x: number; y: number },
  canvasSize: { width: number; height: number },
  canvasState: CanvasState
) => {
  return {
    x: (screen.x - canvasState.panX) / (canvasSize.width * canvasState.zoom),
    y: (screen.y - canvasState.panY) / (canvasSize.height * canvasState.zoom),
  };
};
```

### Grid and Snapping

```tsx
interface GridSettings {
  enabled: boolean;
  size: number;      // Grid cell size (normalized, e.g., 0.1 = 10% of canvas)
  snapEnabled: boolean;
  snapThreshold: number;  // Distance for snapping (normalized)
}

const snapToGrid = (position: number, gridSize: number) => {
  return Math.round(position / gridSize) * gridSize;
};
```

## State Management

### Scene Editor State

```typescript
interface SceneEditorState {
  mode: 'channels' | 'layout';

  // Scene data
  scene: Scene;
  channelValues: ChannelValue[];

  // Layout mode state
  selectedFixtures: string[];  // Fixture IDs
  selectionBox: SelectionBox | null;
  isDragging: boolean;

  // Canvas state
  canvas: CanvasState;
  grid: GridSettings;
}
```

### Mutations and Optimistic Updates

```typescript
// Update fixture position with optimistic UI
const [updateFixturePosition] = useMutation(UPDATE_FIXTURE_POSITION, {
  optimisticResponse: (vars) => ({
    updateFixturePosition: {
      __typename: 'Fixture',
      id: vars.id,
      positionX: vars.positionX,
      positionY: vars.positionY,
    },
  }),
});

// Batch update on drag end
const handleDragEnd = (fixtureId: string, newPosition: { x: number; y: number }) => {
  updateFixturePosition({
    variables: {
      id: fixtureId,
      positionX: newPosition.x,
      positionY: newPosition.y,
    },
  });
};
```

## MCP Integration for AI Layout

### AI Layout Generation

Users can request AI to arrange fixtures based on venue description:

**MCP Tool Addition:**

```typescript
// lacylights-mcp/src/tools/layout.ts
{
  name: 'generate_fixture_layout',
  description: 'Generate optimal 2D fixture positions based on venue description',
  input: {
    projectId: string,
    venueDescription: string,
    layoutStyle?: 'grid' | 'arch' | 'custom',
  },
  output: {
    fixtures: Array<{
      id: string,
      positionX: number,
      positionY: number,
      reasoning: string,
    }>
  }
}
```

**UI Trigger:**

```tsx
<button onClick={() => setShowAILayoutDialog(true)}>
  🤖 AI Suggest Layout
</button>

<AILayoutDialog>
  <textarea
    placeholder="Describe your venue: 'Small theater with 20 fixtures. 8 front wash, 8 back wash, 4 specials...'"
    value={venueDescription}
    onChange={e => setVenueDescription(e.target.value)}
  />
  <button onClick={generateAILayout}>Generate Layout</button>
</AILayoutDialog>
```

**AI Layout Suggestions:**
- Front wash: Top third of canvas
- Back wash: Bottom third
- Specials: Positioned based on described locations
- Symmetric arrangements when appropriate
- Respects fixture groups and types

## Implementation Phases

### Phase 1: Routing and Page Structure (Week 1)
- [ ] Create `/scenes/:sceneId/edit` route
- [ ] Build SceneEditorLayout with mode switcher
- [ ] Refactor existing scene editor into ChannelListEditor component
- [ ] Update scene list page to navigate instead of modal
- [ ] Add back button navigation

### Phase 2: Database and API (Week 1-2)
- [ ] Add position fields to Fixture model (migration)
- [ ] Implement updateFixturePosition mutation
- [ ] Implement updateFixturePositions bulk mutation
- [ ] Update fixture queries to include positions
- [ ] Add position indices for performance

### Phase 3: Basic 2D Canvas (Week 2)
- [ ] Create Canvas2D component with pan/zoom
- [ ] Implement coordinate conversion utilities
- [ ] Build FixtureBox component with color display
- [ ] Add drag-and-drop for fixture positioning
- [ ] Persist positions to backend on drag end

### Phase 4: Multi-Select (Week 3)
- [ ] Implement selection box drag functionality
- [ ] Add click selection with Shift modifier
- [ ] Build SelectionBox visual component
- [ ] Add keyboard shortcuts (Cmd+A, Escape)
- [ ] Show selection count in UI

### Phase 5: Group Controls (Week 3-4)
- [ ] Build channel merging logic
- [ ] Create MultiSelectControls component
- [ ] Implement group channel sliders
- [ ] Add color picker for RGB fixtures
- [ ] Show variation indicators
- [ ] Handle partial channel coverage

### Phase 6: Canvas Features (Week 4)
- [ ] Add grid overlay
- [ ] Implement snap-to-grid
- [ ] Add toolbar with zoom controls
- [ ] Implement view reset button
- [ ] Add fixture labels toggle

### Phase 7: MCP AI Integration (Week 5)
- [ ] Create generateFixtureLayout MCP tool
- [ ] Build AI layout dialog UI
- [ ] Implement layout suggestion preview
- [ ] Add apply/reject layout controls
- [ ] Document AI layout patterns

### Phase 8: Polish and Testing (Week 5-6)
- [ ] Add loading states and error handling
- [ ] Implement undo/redo for positions
- [ ] Add fixture search/filter in layout view
- [ ] Write component tests
- [ ] Add E2E tests for layout editor
- [ ] Performance optimization (canvas rendering)
- [ ] Documentation and user guide

## Technical Considerations

### Performance

**Canvas Rendering:**
- Use `requestAnimationFrame` for smooth dragging
- Implement viewport culling (only render visible fixtures)
- Debounce position updates to backend
- Use CSS transforms for movement (GPU acceleration)

**Large Projects:**
- Virtualize fixture list if >100 fixtures
- Add fixture grouping/clustering for organization
- Implement search/filter to focus on subset

### Browser Compatibility

- Test drag-and-drop on mobile (touch events)
- Ensure pan/zoom works with trackpad and mouse
- Test color display accuracy across browsers

### Accessibility

- Keyboard navigation for fixture selection
- Screen reader support for fixture positions
- High contrast mode for fixture boxes
- Keyboard shortcuts listed in help dialog

## Open Questions

1. **Fixture Size:** Should all fixtures be same size, or scale based on beam angle/power?
   - Recommendation: Start with uniform size, add scaling later

2. **Z-ordering:** What if fixtures overlap?
   - Recommendation: Last dragged goes on top, add explicit ordering later

3. **Rotation Display:** Show fixture beam direction?
   - Recommendation: Phase 2 feature, use arrow/cone icon

4. **Multi-drag:** Can selected fixtures be dragged together?
   - Recommendation: Yes, drag any selected fixture moves all

5. **Undo/Redo:** Should layout changes be undoable?
   - Recommendation: Yes, critical for experimentation

## Success Metrics

- Users can arrange 20 fixtures in under 2 minutes
- Multi-select and group control works intuitively
- Color display accurately reflects scene state
- AI layout suggestion saves 50%+ setup time
- Zero data loss on position updates
- <100ms drag response time

## Documentation Needed

- User guide: "Using the 2D Layout Editor"
- Video tutorial: "Setting up your fixture layout"
- MCP documentation: "AI fixture layout suggestions"
- API documentation: Updated GraphQL schema

---

## Next Steps

1. **Review this plan** - Discuss any changes or concerns
2. **Approve database schema** - Ensure position fields meet needs
3. **Prioritize phases** - Decide if any should be reordered
4. **Start Phase 1** - Begin with routing and page structure
5. **Iterate** - Review after each phase, adjust as needed
