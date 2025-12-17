# Scene Board Refactoring Progress

**Specification:** See `SCENE_BOARD_INTERACTION_SPEC.md` for complete interaction details.

**Goal:** Refactor Scene Board to support multi-select, context menus, keyboard shortcuts, and distinguish between Layout Mode and Play Mode.

---

## Implementation Status

### Phase 1: Core Infrastructure
- [ ] Add mode state (Layout Mode vs Play Mode)
  - [ ] Add `isLayoutMode` prop/state to SceneBoardClient
  - [ ] Add mode toggle UI in toolbar (above canvas)
  - [ ] Persist mode preference (localStorage or URL param)

- [ ] Add selection state management
  - [ ] Add `selectedButtonIds: Set<string>` state
  - [ ] Add selection helper functions (selectButton, deselectButton, toggleSelection, clearSelection, selectAll)
  - [ ] Add visual selection indicator (highlight border on selected buttons)

- [ ] Add keyboard event listener infrastructure
  - [ ] Add global keyboard event listener with proper cleanup
  - [ ] Implement keyboard shortcut dispatcher
  - [ ] Handle modifier keys (Shift, Cmd/Ctrl)

### Phase 2: Context Menus
- [ ] Create context menu component
  - [ ] Build generic ContextMenu component (position, options, onSelect, onDismiss)
  - [ ] Add click-outside detection to close menu
  - [ ] Style menu with shadow and proper z-index

- [ ] Button context menu
  - [ ] Detect right-click on button (mouse)
  - [ ] Detect two-finger click on button (trackpad)
  - [ ] Detect long-press on button (touch - 500ms threshold)
  - [ ] Show menu with "Remove" option
  - [ ] Implement remove handler
  - [ ] Ensure long-press doesn't trigger drag

- [ ] Canvas context menu
  - [ ] Detect right-click on empty canvas
  - [ ] Detect two-finger click on empty canvas
  - [ ] Detect long-press on empty canvas (touch)
  - [ ] Show menu with "Add Scenes...", "Rename Board", "Select All"
  - [ ] Implement "Add Scenes" handler (modal/picker)
  - [ ] Implement "Rename Board" handler
  - [ ] Implement "Select All" handler

- [ ] Remove existing "remove" links from buttons
  - [ ] Remove inline remove UI from button rendering
  - [ ] Update button styles to remove space for remove link

### Phase 3: Multi-Select Support
- [x] Mouse multi-select
  - [x] Shift+click to toggle selection
  - [x] Cmd/Ctrl+click to toggle selection
  - [x] Click on selected button keeps selection (for multi-drag)
  - [x] Click on empty canvas clears selection

- [x] Touch multi-select
  - [x] Long-press on button (500ms) to toggle selection
  - [x] Haptic feedback on long-press (if available)
  - [x] Prevent drag when long-press menu appears
  - [x] Tap on button for single selection (clears others)

- [x] Marquee selection
  - [x] Detect Shift+drag on empty canvas (mouse/trackpad)
  - [x] Detect long-press then drag on empty canvas (touch)
  - [x] Draw selection rectangle (blue for mouse, green for touch)
  - [x] Update selection as marquee is dragged
  - [x] Add to existing selection (not replace)
  - [x] Select all buttons intersecting rectangle

- [x] Multi-button drag
  - [x] When dragging a selected button (mouse), move all selected buttons
  - [x] When dragging a selected button (touch), move all selected buttons
  - [x] Maintain relative positions between buttons
  - [x] Clamp all buttons to canvas boundaries
  - [x] Update all button positions in backend
  - [x] Prevent canvas pan when dragging buttons (touch)

### Phase 4: Keyboard Shortcuts
- [x] Selection shortcuts
  - [x] `Escape` - Clear selection
  - [x] `Cmd/Ctrl + A` - Select all buttons
  - [x] `Delete` / `Backspace` - Remove selected buttons

- [ ] Undo/Redo
  - [ ] `Cmd/Ctrl + Z` - Undo
  - [ ] `Cmd/Ctrl + Shift + Z` - Redo
  - [ ] Implement undo stack for position changes
  - [ ] Implement undo stack for button removal

- [x] Zoom shortcuts
  - [x] `+` / `=` - Zoom in (centered on viewport)
  - [x] `-` - Zoom out (centered on viewport)
  - [x] `0` - Fit all buttons in view

- [x] Nudge shortcuts
  - [x] Arrow keys - Nudge selected buttons 10px
  - [x] Shift + Arrow keys - Nudge selected buttons 1px

### Phase 5: Toolbar Controls
- [ ] Add toolbar above canvas
  - [ ] Create toolbar component/section
  - [ ] Position above canvas (not floating)
  - [ ] Responsive layout for mobile

- [ ] Zoom controls
  - [ ] Add magnifying glass icon button
  - [ ] Create zoom control popover (slider or +/- buttons)
  - [ ] Add Fit button
  - [ ] Connect controls to zoom handlers

- [ ] Mode toggle (if not already done in Phase 1)
  - [ ] Layout Mode / Play Mode toggle button
  - [ ] Visual indicator of current mode

### Phase 6: Play Mode Restrictions
- [x] Disable editing in Play Mode
  - [x] Disable selection (clicks don't select)
  - [x] Disable drag-to-move (drag on buttons pans viewport instead)
  - [x] Disable context menus
  - [x] Disable keyboard shortcuts (except zoom)
  - [x] Hide mode-specific UI (selection indicators)

- [x] Enable performance features in Play Mode
  - [x] Single-finger drag anywhere pans (including on buttons)
  - [x] Scene activation on tap/click (no selection)
  - [x] Keep zoom/pan gestures working

### Phase 7: Gesture Conflict Resolution
- [ ] Touch gesture priorities
  - [ ] Two-finger gesture always triggers zoom/pan
  - [ ] Long-press cancels drag and shows menu
  - [ ] Drag threshold (10px) before drag starts
  - [ ] Tap detection (<300ms, <10px movement)

- [ ] Mouse gesture priorities
  - [ ] Right-click always shows context menu
  - [ ] Middle-click always pans
  - [ ] Shift+drag on canvas always marquee selects
  - [ ] Drag on button moves if selected

### Phase 8: Testing & Polish
- [ ] Test all mouse interactions (per checklist in spec)
- [ ] Test all trackpad interactions (per checklist in spec)
- [ ] Test all touchscreen interactions (per checklist in spec)
- [ ] Test Layout Mode vs Play Mode differences
- [ ] Test keyboard shortcuts
- [ ] Test gesture conflict resolution
- [ ] Add visual feedback polish
  - [ ] Selection state animations
  - [ ] Long-press progress indicator
  - [ ] Marquee selection styling
  - [ ] Context menu animations
  - [ ] Button drag opacity/shadow
- [ ] Performance testing
  - [ ] Test with many buttons (50+)
  - [ ] Test rapid zoom/pan/select operations
  - [ ] Test on mobile devices

### Phase 9: Documentation & Cleanup
- [ ] Update component documentation
- [ ] Add JSDoc comments to new functions
- [ ] Write unit tests for new functionality
  - [ ] Selection state management
  - [ ] Context menu behavior
  - [ ] Keyboard shortcut handlers
  - [ ] Multi-button drag logic
  - [ ] Gesture detection
- [ ] Update README if needed
- [ ] Clean up any deprecated code
- [ ] Remove debug logging

---

## Current Status

**Phase:** Phase 3 Complete + Dynamic Coordinate Recalibration Implemented

**Last Updated:** 2025-12-17

**Completed in this session:**
- ✅ Phase 3: Multi-Select Support (Complete - All Input Methods)
  - **Mouse/Trackpad Multi-Select** (from previous sessions):
    - Shift+click and Cmd/Ctrl+click to toggle button selection
    - Click on button to select (clears others unless modifier pressed)
    - Click on empty canvas to clear selection
    - Shift+drag for marquee selection with blue rectangle

  - **Touchscreen Multi-Select** (completed this session):
    - Tap on button for single selection (clears others)
    - Long-press on button (500ms) to toggle multi-selection
    - Haptic feedback on long-press
    - Long-press on canvas + drag for marquee selection (green rectangle)
    - Touch tap on canvas to clear selection

  - **Multi-Button Drag** (both mouse and touch):
    - When dragging a selected button, all selected buttons move together
    - Maintained relative positions during multi-button drag
    - Canvas pan properly blocked when dragging buttons on touch
    - Updated positions saved to backend for all buttons at once

  - **Bug Fixes**:
    - Fixed marquee selection not persisting on mouse release
    - Fixed React hooks ordering issues (toggleButtonSelection, startLongPress)
    - Fixed canvas pan conflict with button drag on touchscreen
    - Fixed touch state conflicts between button and canvas handlers
    - Removed all debug console.log statements

- ✅ Dynamic Coordinate Recalibration (NEW)
  - Added flexible origin system to allow buttons to be dragged beyond canvas bounds
  - Implemented automatic recalibration on drag end to bring all buttons back within bounds
  - Added `recalibrateButtonPositions` utility function with comprehensive unit tests
  - Removed clamping from drag handlers to allow temporary out-of-bounds positioning
  - All button positions update atomically when recalibration occurs
  - Maintains relative positions between buttons during recalibration
  - Handles edge cases: single button, multi-axis recalibration, buttons too spread out

**Next Steps:**
1. Add animation for smooth recalibration transition (200ms with easing)
2. Add undo/redo support for position changes (Phase 4 remaining item)
3. Add toolbar controls (Phase 5 - zoom controls, mode toggle)
4. Comprehensive testing and polish (Phase 8)
5. Documentation cleanup (Phase 9)

---

## Notes

- Current implementation already has: pixel coordinates, transform-based rendering, pinch-to-zoom, pan, button dragging
- Main work is adding: context menus, multi-select, keyboard shortcuts, mode differentiation
- Follow existing patterns from 2D Layout view where applicable
- Keep mobile-first approach, ensure all features work on touch devices
- No floating UI on canvas - keep toolbar above canvas

---

## Testing Checklist Reference

See `SCENE_BOARD_INTERACTION_SPEC.md` section "Testing Checklist" for complete test matrix covering:
- Layout Mode - Mouse
- Layout Mode - Trackpad
- Layout Mode - Touchscreen
- Play Mode - All Input Methods
