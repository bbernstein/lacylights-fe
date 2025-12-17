# Scene Board Interaction Specification

This document details all interactions for the Scene Board component, covering both **Layout Mode** (editing) and **Play Mode** (performance), across all input methods: mouse, touchpad, and touchscreen.

## Overview

The Scene Board provides a 2D canvas for arranging and activating scene buttons. It operates in two modes:

- **Layout Mode**: Edit button positions, add/remove buttons, configure the board
- **Play Mode**: Activate scenes during performance (read-only layout)

The interaction model should match the 2D Layout view in the Scene Editor for consistency.

---

## Coordinate System

- **Fixed Canvas**: 2000x2000px (configurable per board)
- **Pixel Coordinates**: Buttons use integer pixel positions (layoutX, layoutY)
- **Grid Snapping**: 10px fine grid for positioning
- **Zoom Range**: 0.2x - 3.0x
- **Transform-Based**: CSS transforms for GPU-accelerated rendering

### Dynamic Coordinate Recalibration

The canvas uses a **flexible origin system** that automatically recalibrates when buttons are dragged beyond the current canvas bounds. This allows users to freely position buttons without being constrained by hard boundaries.

#### Current Limitation (Before Recalibration)

Currently, buttons are hard-clamped to the canvas boundaries:

- Minimum X: 0px
- Minimum Y: 0px
- Maximum X: canvasWidth - buttonWidth (e.g., 2000 - 200 = 1800px)
- Maximum Y: canvasHeight - buttonHeight (e.g., 2000 - 120 = 1880px)

When dragging a button to the left or top edge, it stops at position 0. This feels restrictive and unnatural.

#### New Behavior (With Recalibration)

When a button is dragged beyond the current canvas bounds, the system automatically **recalibrates all button coordinates** to shift everything back onto the canvas while maintaining relative positions.

**Example 1: Dragging Left Beyond Origin**

Initial state:

```
Button A: (100, 500)
Button B: (300, 500)
Button C: (500, 200)
```

User drags Button A to (-150, 500):

1. System detects that x=-150 is beyond the left edge (x < 0)
2. Calculates offset needed: 150px shift right
3. Recalibrates ALL button coordinates:
   ```
   Button A: (0, 500)     // was (-150, 500), shifted +150
   Button B: (450, 500)   // was (300, 500), shifted +150
   Button C: (650, 200)   // was (500, 200), shifted +150
   ```
4. Saves the new coordinates to the backend
5. Canvas content remains visually unchanged for the user

**Example 2: Dragging Right Beyond Canvas**

Canvas width: 2000px, Button width: 200px
Initial state:

```
Button A: (1700, 300)
Button B: (200, 500)
```

User drags Button A to (2100, 300) - this would put the button at 2100-2300px:

1. System detects rightmost edge at 2300px exceeds canvas width (2000px)
2. Excess: 2300 - 2000 = 300px
3. Check if we can shift everything left by 300px
4. Find leftmost button: Button B at x=0 (after considering its position)
5. Recalibrates ALL button coordinates:
   ```
   Button A: (1800, 300)  // now at right edge (2000 - 200)
   Button B: (0, 500)     // shifted to left edge if needed
   ```

**Example 3: Multi-Button Drag Beyond Bounds**

When dragging multiple selected buttons, the same recalibration applies to the group:

Initial state:

```
Button A: (50, 100) - SELECTED
Button B: (200, 100) - SELECTED
Button C: (1800, 500)
```

User drags the selected buttons 100px to the left:

1. Button A would be at (-50, 100)
2. Button B would be at (100, 100)
3. System detects x=-50 is beyond left edge
4. Recalibrates ALL buttons (including non-selected ones):
   ```
   Button A: (0, 100)      // shifted +50
   Button B: (150, 100)    // shifted +50
   Button C: (1850, 100)   // shifted +50
   ```

#### Canvas Size Constraints

While the origin is flexible, the **canvas size remains fixed** at the configured dimensions (e.g., 2000x2000px):

- **Minimum Canvas Usage**: The bounding box of all buttons must fit within the canvas dimensions
- **Maximum Spread**: If buttons are spread too far apart, recalibration will fail and the drag will be limited
- **Maximum Bounds**: The system will prevent dragging if recalibration would cause any button to exceed the canvas size

**Example: Maximum Spread Limit**

Canvas: 2000x2000px, Button dimensions: 200x120px

```
Button A: (0, 0)
Button B: (1800, 0)    // rightmost position (2000 - 200)
```

Total horizontal spread: 2000px (0 to 2000) - this is at maximum capacity.

If the user tries to drag Button A further left (to x=-100):

1. System calculates required shift: +100 for all buttons
2. Button B would need to be at: 1800 + 100 = 1900px
3. Button B right edge: 1900 + 200 = 2100px (exceeds 2000px canvas width)
4. **Drag is limited**: Button A can only go to x=0 (current position)

#### When Recalibration Occurs

Recalibration happens **on drag end** (when the user releases the mouse/finger):

1. User drags button(s) beyond canvas bounds
2. During drag: visual feedback shows the button(s) at the desired position (may be off-canvas)
3. On drag end:
   - System detects coordinates outside bounds
   - Calculates minimum recalibration offset needed
   - Updates ALL button coordinates atomically
   - Saves to backend in a single transaction
   - UI updates to show recalibrated positions

#### Edge Cases

1. **Empty Canvas**: If there's only one button and it's dragged beyond bounds, it simply snaps to the nearest edge (no recalibration needed)

2. **Insufficient Space**: If recalibration would require shifting buttons beyond the canvas size, the drag is constrained to the maximum allowed position

3. **Multi-Axis Recalibration**: If a button is dragged beyond both X and Y bounds, recalibration happens on both axes simultaneously:

   ```
   Drag to (-50, -100)
   → Shift all buttons: +50 on X axis, +100 on Y axis
   ```

4. **Undo/Redo**: Recalibration is treated as a single atomic operation in the undo stack, affecting all buttons at once

#### Visual Feedback

During drag (before recalibration):

- Buttons being dragged can visually appear beyond canvas edges
- No other buttons move yet

On drag end (after recalibration):

- Button coordinates are updated to bring everything within canvas bounds
- Viewport pan is adjusted to compensate for coordinate changes
- **Result: Buttons remain visually stationary on screen** - the coordinate system shifts underneath
- No animation needed - user sees the button exactly where they placed it
- Example:
  - User drags button to screen position where canvas Y=-10
  - Button coordinate updated to Y=0 (shift +10)
  - All buttons shift +10 in Y coordinates
  - Viewport offsetY adjusted by -10 \* scale
  - Button appears at same screen position where user released it

#### Backend Considerations

- **Atomic Updates**: All button position updates happen in a single database transaction
- **Conflict Resolution**: If another user modifies button positions simultaneously, last-write-wins with full recalibration on next sync
- **Performance**: Recalibration calculations happen client-side; only final coordinates are sent to backend

---

## Mode Summary

| Feature        | Layout Mode        | Play Mode          |
| -------------- | ------------------ | ------------------ |
| Zoom/Pan       | ✅ Yes             | ✅ Yes             |
| Select Button  | ✅ Yes             | ❌ No              |
| Multi-Select   | ✅ Yes             | ❌ No              |
| Move Button    | ✅ Yes             | ❌ No              |
| Activate Scene | ✅ Yes (tap/click) | ✅ Yes (tap/click) |
| Context Menu   | ✅ Yes             | ❌ No              |
| Add Buttons    | ✅ Yes (via menu)  | ❌ No              |
| Remove Buttons | ✅ Yes (via menu)  | ❌ No              |

---

## Layout Mode Interactions

### 1. Viewport Navigation

#### Zooming

| Input Method       | Action                   | Behavior                            |
| ------------------ | ------------------------ | ----------------------------------- |
| **Mouse Wheel**    | Scroll wheel up/down     | Zoom in/out centered on cursor      |
| **Trackpad Pinch** | Two-finger pinch gesture | Zoom in/out centered on pinch point |
| **Touchscreen**    | Two-finger pinch         | Zoom in/out centered on midpoint    |
| **Keyboard**       | `+`/`=` or `-`           | Zoom in/out centered on viewport    |
| **Keyboard**       | `0`                      | Fit all buttons in view             |
| **Toolbar**        | Magnifying glass icon    | Opens zoom control (slider or +/-)  |
| **Toolbar**        | Fit button               | Auto-zoom to fit all buttons        |

**Technical Details:**

- Trackpad pinch detected via `wheel` event with `e.ctrlKey === true`
- Zoom center maintained throughout continuous gesture
- Zoom limits: 0.2x minimum, 3.0x maximum
- Smooth zoom animation with easing
- Toolbar controls are above the canvas (not floating on canvas)

#### Panning

| Input Method    | Action                             | Behavior                                |
| --------------- | ---------------------------------- | --------------------------------------- |
| **Mouse**       | Click + drag on empty canvas       | Pan viewport                            |
| **Mouse**       | Middle-click + drag anywhere       | Pan viewport (overrides other gestures) |
| **Trackpad**    | Two-finger scroll                  | Pan viewport                            |
| **Trackpad**    | Two-finger drag during pinch       | Pan while zooming                       |
| **Touchscreen** | Single-finger drag on empty canvas | Pan viewport                            |
| **Touchscreen** | Two-finger drag                    | Pan viewport (with or without zoom)     |

**Technical Details:**

- Pan threshold: 5px before pan activates (prevents accidental movement)
- Simultaneous pan during pinch-to-zoom (tracks midpoint movement)
- Canvas boundaries are soft (can pan past content)

---

### 2. Button Selection

#### Single Selection

| Input Method    | Action          | Behavior                               |
| --------------- | --------------- | -------------------------------------- |
| **Mouse**       | Click on button | Select button (clears other selection) |
| **Trackpad**    | Click on button | Select button (clears other selection) |
| **Touchscreen** | Tap on button   | Select button (clears other selection) |

**Technical Details:**

- Tap detection: <300ms duration AND <10px movement
- Visual indicator: highlight/border on selected button

#### Multi-Selection (Add to Selection)

| Input Method    | Action                     | Behavior                         |
| --------------- | -------------------------- | -------------------------------- |
| **Mouse**       | Shift + click on button    | Toggle button in selection       |
| **Mouse**       | Cmd/Ctrl + click on button | Toggle button in selection       |
| **Trackpad**    | Shift + click on button    | Toggle button in selection       |
| **Touchscreen** | Long-press on button       | Add button to selection (toggle) |

**Technical Details:**

- Long-press threshold: 500ms
- Haptic feedback on long-press (if available)
- Long-press does NOT trigger drag

#### Marquee Selection (Rectangle Select)

| Input Method    | Action                                | Behavior                 |
| --------------- | ------------------------------------- | ------------------------ |
| **Mouse**       | Shift + drag on empty canvas          | Draw selection rectangle |
| **Trackpad**    | Shift + drag on empty canvas          | Draw selection rectangle |
| **Touchscreen** | Long-press on empty canvas, then drag | Draw selection rectangle |

**Technical Details:**

- Marquee adds to existing selection (doesn't clear)
- Touch marquee shows green dashed rectangle (differentiates from mouse)
- All buttons intersecting rectangle are selected

#### Clear Selection

| Input Method    | Action                | Behavior            |
| --------------- | --------------------- | ------------------- |
| **Mouse**       | Click on empty canvas | Clear all selection |
| **Trackpad**    | Click on empty canvas | Clear all selection |
| **Touchscreen** | Tap on empty canvas   | Clear all selection |
| **Keyboard**    | Press Escape          | Clear all selection |

---

### 3. Moving Buttons

#### Single Button Drag

| Input Method    | Action                 | Behavior                    |
| --------------- | ---------------------- | --------------------------- |
| **Mouse**       | Click + drag on button | Move button to new position |
| **Trackpad**    | Click + drag on button | Move button to new position |
| **Touchscreen** | Touch + drag on button | Move button to new position |

**Technical Details:**

- Drag threshold: 10px before drag starts (prevents accidental moves)
- Grid snapping: 10px during drag
- Real-time position update (optimistic UI)
- Auto-save on drag end

#### Multi-Button Drag

| Input Method    | Action                   | Behavior                           |
| --------------- | ------------------------ | ---------------------------------- |
| **Mouse**       | Drag any selected button | Move all selected buttons together |
| **Trackpad**    | Drag any selected button | Move all selected buttons together |
| **Touchscreen** | Drag any selected button | Move all selected buttons together |

**Technical Details:**

- All selected buttons maintain relative positions
- Positions clamped to canvas boundaries
- Undo/redo support for position changes

---

### 4. Context Menus

Context menus appear on right-click (mouse) or long-press (touch). They replace the need for visible "remove" links that can be accidentally clicked.

#### Button Context Menu

**Trigger:**
| Input Method | Action |
|--------------|--------|
| **Mouse** | Right-click on button |
| **Trackpad** | Two-finger click on button (macOS) |
| **Touchscreen** | Long-press on button (500ms) |

**Menu Options:**

- **Remove** - Delete the button from the board
- (Future options can be added here)

**Technical Details:**

- Menu appears at cursor/touch position
- Click/tap outside menu dismisses it
- Long-press on touchscreen shows menu without triggering drag
- When long-press triggers menu, subsequent drag is ignored

#### Canvas Context Menu

**Trigger:**
| Input Method | Action |
|--------------|--------|
| **Mouse** | Right-click on empty canvas |
| **Trackpad** | Two-finger click on empty canvas |
| **Touchscreen** | Long-press on empty canvas (500ms) |

**Menu Options:**

- **Add Scenes...** - Open scene picker to add buttons
- **Rename Board** - Change the board name
- **Select All** - Select all buttons
- (Future options can be added here)

**Technical Details:**

- Menu appears at cursor/touch position
- "Add Scenes" opens a modal/picker for scene selection

---

### 5. Scene Activation (in Layout Mode)

Even in Layout Mode, users can activate scenes for testing purposes.

| Input Method    | Action          | Behavior                         |
| --------------- | --------------- | -------------------------------- |
| **Mouse**       | Click on button | Select button AND activate scene |
| **Trackpad**    | Click on button | Select button AND activate scene |
| **Touchscreen** | Tap on button   | Select button AND activate scene |

**Note:** Scene activation happens on tap/click, not on selection. This allows users to test scenes while editing.

---

## Play Mode Interactions

In Play Mode, the board is locked for performance use. No editing operations are available.

### 1. Viewport Navigation

Identical to Layout Mode:

#### Zooming

| Input Method       | Action                | Behavior                         |
| ------------------ | --------------------- | -------------------------------- |
| **Mouse Wheel**    | Scroll wheel          | Zoom centered on cursor          |
| **Trackpad Pinch** | Two-finger pinch      | Zoom centered on pinch point     |
| **Touchscreen**    | Two-finger pinch      | Zoom centered on midpoint        |
| **Keyboard**       | `+`/`=` or `-`        | Zoom in/out centered on viewport |
| **Keyboard**       | `0`                   | Fit all buttons in view          |
| **Toolbar**        | Magnifying glass icon | Opens zoom control               |
| **Toolbar**        | Fit button            | Auto-zoom to fit all buttons     |

#### Panning

| Input Method    | Action                      | Behavior     |
| --------------- | --------------------------- | ------------ |
| **Mouse**       | Click + drag anywhere       | Pan viewport |
| **Trackpad**    | Two-finger scroll           | Pan viewport |
| **Touchscreen** | Single-finger drag anywhere | Pan viewport |

**Note:** In Play Mode, drag on buttons also pans (since move is disabled).

---

### 2. Scene Activation

| Input Method    | Action          | Behavior       |
| --------------- | --------------- | -------------- |
| **Mouse**       | Click on button | Activate scene |
| **Trackpad**    | Click on button | Activate scene |
| **Touchscreen** | Tap on button   | Activate scene |

**Technical Details:**

- Tap detection: <300ms duration AND <10px movement
- Visual feedback: button press animation
- No selection highlight (selection is disabled)
- No context menus available

---

## Gesture Conflict Resolution

When multiple gestures could apply, priority determines behavior:

### Touch Gesture Priority (Layout Mode)

1. **Two-finger gesture** → Always zoom/pan (highest priority)
2. **Long-press detected** → Show context menu (cancels drag)
3. **Drag threshold exceeded** → Start drag/pan
4. **Tap detected** → Select/activate

### Touch Gesture Priority (Play Mode)

1. **Two-finger gesture** → Always zoom/pan
2. **Single-finger drag** → Pan viewport
3. **Tap detected** → Activate scene

### Mouse Gesture Priority

1. **Right-click** → Context menu
2. **Middle-click drag** → Pan (always)
3. **Shift + drag on canvas** → Marquee select
4. **Drag on button** → Move button
5. **Drag on canvas** → Pan
6. **Click** → Select/activate

---

## Visual Feedback

### Selection States

- **Not selected**: Default button appearance
- **Selected**: Highlight border (e.g., 2px blue border)
- **Multi-selected**: Same highlight on all selected buttons
- **Drag in progress**: Slight opacity change or shadow

### Context Menu Indicators

- **Long-press in progress**: Subtle pulse animation on touch point
- **Menu open**: Dropdown menu with shadow

### Activation Feedback

- **Button press**: Scale down briefly (press effect)
- **Active scene**: Button glows or shows active state

### Marquee Selection

- **Mouse marquee**: Blue dashed rectangle
- **Touch marquee**: Green dashed rectangle (differentiated for clarity)

---

## Keyboard Shortcuts (Layout Mode)

| Shortcut               | Action                            |
| ---------------------- | --------------------------------- |
| `Escape`               | Clear selection                   |
| `Cmd/Ctrl + A`         | Select all buttons                |
| `Delete` / `Backspace` | Remove selected buttons           |
| `Cmd/Ctrl + Z`         | Undo                              |
| `Cmd/Ctrl + Shift + Z` | Redo                              |
| `+` / `=`              | Zoom in                           |
| `-`                    | Zoom out                          |
| `0`                    | Fit to view                       |
| Arrow keys             | Nudge selected buttons (10px)     |
| Shift + Arrow keys     | Nudge selected buttons (1px fine) |

---

## Platform-Specific Considerations

### Desktop (macOS/Windows/Linux)

- Full keyboard shortcut support
- Right-click for context menus
- Two-finger click = right-click on macOS trackpad
- Mouse wheel for zoom
- Trackpad pinch-to-zoom support

### Mobile (iOS/Android)

- No keyboard shortcuts
- Long-press for context menus
- Two-finger pinch for zoom
- Single-finger drag for pan (on empty canvas)
- Large touch targets (minimum 44x44px, recommended 200x120px for buttons)
- Haptic feedback on long-press

### Tablet (iPad/Android Tablet)

- Hybrid: supports both touch and keyboard (with external keyboard)
- Apple Pencil: treated as single-finger touch
- Mouse support (iPadOS): enables right-click context menus

---

## Implementation Notes

### Event Handling

- Use `addEventListener` with `{ passive: false }` for touch events to allow `preventDefault()`
- Prevent default touch scrolling on canvas
- Use `pointerdown`/`pointermove`/`pointerup` for unified mouse/touch handling where possible
- Fall back to separate touch/mouse events for complex gesture handling

### State Management

```typescript
interface GestureState {
  // Two-finger gesture state
  isPinching: boolean;
  initialPinchDistance: number | null;
  initialPinchScale: number;
  pinchMidpoint: { x: number; y: number } | null;

  // Single-finger/mouse state
  isPanning: boolean;
  isDragging: boolean;
  panStart: { x: number; y: number } | null;

  // Selection state
  isMarqueeSelecting: boolean;
  marqueeStart: { x: number; y: number } | null;
  marqueeEnd: { x: number; y: number } | null;

  // Long-press state
  longPressTimer: number | null;
  longPressTarget: "button" | "canvas" | null;
  longPressPosition: { x: number; y: number } | null;

  // Context menu state
  contextMenuOpen: boolean;
  contextMenuPosition: { x: number; y: number } | null;
  contextMenuType: "button" | "canvas" | null;
}
```

### Coordinate Conversion

```typescript
// Screen coordinates to canvas coordinates
function screenToCanvas(
  screenX: number,
  screenY: number,
  viewport: { scale: number; offsetX: number; offsetY: number },
  canvasRect: DOMRect,
): { x: number; y: number } {
  const x = (screenX - canvasRect.left) / viewport.scale - viewport.offsetX;
  const y = (screenY - canvasRect.top) / viewport.scale - viewport.offsetY;
  return { x, y };
}
```

---

## Testing Checklist

### Layout Mode - Mouse

- [ ] Click button to select
- [ ] Shift+click to multi-select
- [ ] Click canvas to deselect
- [ ] Drag button to move
- [ ] Drag selected buttons to move all
- [ ] Drag canvas to pan
- [ ] Shift+drag canvas for marquee select
- [ ] Mouse wheel to zoom
- [ ] Right-click button for context menu
- [ ] Right-click canvas for context menu
- [ ] Remove button via context menu
- [ ] Add scenes via context menu

### Layout Mode - Trackpad

- [ ] Click button to select
- [ ] Two-finger scroll to pan
- [ ] Pinch to zoom
- [ ] Two-finger click for context menu

### Layout Mode - Touchscreen

- [ ] Tap button to select
- [ ] Long-press button for context menu
- [ ] Long-press button to add to selection
- [ ] Tap canvas to deselect
- [ ] Single-finger drag button to move
- [ ] Single-finger drag canvas to pan
- [ ] Long-press canvas + drag for marquee select
- [ ] Long-press canvas for context menu
- [ ] Two-finger pinch to zoom
- [ ] Two-finger drag to pan
- [ ] Remove button via context menu
- [ ] Add scenes via context menu

### Play Mode - All Input Methods

- [ ] Zoom works (all methods)
- [ ] Pan works (all methods)
- [ ] Tap/click activates scene
- [ ] No selection highlighting
- [ ] No drag-to-move
- [ ] No context menus
- [ ] No keyboard shortcuts for editing

---

## Migration from Current Implementation

The current Scene Board implementation already supports:

- ✅ Pixel-based coordinates (2000x2000px)
- ✅ Transform-based rendering
- ✅ Two-finger pinch-to-zoom with pan
- ✅ Single-finger pan on canvas
- ✅ Button dragging
- ✅ Trackpad zoom/pan

Changes needed:

- ❌ → ✅ Add context menus (right-click/long-press)
- ❌ → ✅ Remove visible "remove" links on buttons
- ❌ → ✅ Add multi-select support (Shift+click, long-press toggle)
- ❌ → ✅ Add marquee selection
- ❌ → ✅ Add keyboard shortcuts
- ❌ → ✅ Differentiate Layout Mode vs Play Mode interactions
- ❌ → ✅ Add canvas context menu for add scenes/rename board
