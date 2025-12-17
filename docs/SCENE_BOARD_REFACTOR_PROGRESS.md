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
- [ ] Mouse multi-select
  - [ ] Shift+click to toggle selection
  - [ ] Cmd/Ctrl+click to toggle selection
  - [ ] Click on selected button keeps selection (for multi-drag)
  - [ ] Click on empty canvas clears selection

- [ ] Touch multi-select
  - [ ] Long-press on button (500ms) to toggle selection
  - [ ] Haptic feedback on long-press (if available)
  - [ ] Prevent drag when long-press menu appears

- [ ] Marquee selection
  - [ ] Detect Shift+drag on empty canvas (mouse/trackpad)
  - [ ] Detect long-press then drag on empty canvas (touch)
  - [ ] Draw selection rectangle (blue for mouse, green for touch)
  - [ ] Update selection as marquee is dragged
  - [ ] Add to existing selection (not replace)
  - [ ] Select all buttons intersecting rectangle

- [ ] Multi-button drag
  - [ ] When dragging a selected button, move all selected buttons
  - [ ] Maintain relative positions between buttons
  - [ ] Clamp all buttons to canvas boundaries
  - [ ] Update all button positions in backend

### Phase 4: Keyboard Shortcuts
- [ ] Selection shortcuts
  - [ ] `Escape` - Clear selection
  - [ ] `Cmd/Ctrl + A` - Select all buttons
  - [ ] `Delete` / `Backspace` - Remove selected buttons

- [ ] Undo/Redo
  - [ ] `Cmd/Ctrl + Z` - Undo
  - [ ] `Cmd/Ctrl + Shift + Z` - Redo
  - [ ] Implement undo stack for position changes
  - [ ] Implement undo stack for button removal

- [ ] Zoom shortcuts
  - [ ] `+` / `=` - Zoom in (centered on viewport)
  - [ ] `-` - Zoom out (centered on viewport)
  - [ ] `0` - Fit all buttons in view

- [ ] Nudge shortcuts
  - [ ] Arrow keys - Nudge selected buttons 10px
  - [ ] Shift + Arrow keys - Nudge selected buttons 1px

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
- [ ] Disable editing in Play Mode
  - [ ] Disable selection (clicks don't select)
  - [ ] Disable drag-to-move (drag on buttons pans viewport instead)
  - [ ] Disable context menus
  - [ ] Disable keyboard shortcuts (except zoom)
  - [ ] Hide mode-specific UI (selection indicators)

- [ ] Enable performance features in Play Mode
  - [ ] Single-finger drag anywhere pans (including on buttons)
  - [ ] Scene activation on tap/click (no selection)
  - [ ] Keep zoom/pan gestures working

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

**Phase:** Phase 3 Complete - Multi-Select Support Implemented

**Last Updated:** 2025-12-17

**Completed in this session:**
- ✅ Phase 1: Core Infrastructure (Complete - from previous session)
  - Mode state already existed, confirmed working
  - Added selection state management with helper functions
  - Enhanced keyboard event listener with full shortcut support
  - Created ContextMenu component
  - Added button context menu (right-click/long-press)
  - Added canvas context menu (right-click/long-press)
  - Removed inline "remove" links from buttons
  - All keyboard shortcuts implemented (Escape, Ctrl+A, Delete, arrows, zoom)

- ✅ Phase 3: Multi-Select Support (Complete)
  - Implemented Shift+click and Cmd/Ctrl+click to toggle button selection
  - Implemented click on button to select (clears others unless modifier pressed)
  - Implemented click on empty canvas to clear selection
  - Implemented marquee selection with Shift+drag on canvas
  - Visual marquee rectangle with blue border and transparent fill
  - Marquee adds to existing selection (doesn't replace)
  - Implemented multi-button drag - all selected buttons move together
  - Maintained relative positions during multi-button drag
  - Updated positions saved to backend for all buttons at once
  - Added drag threshold to distinguish clicks from drags

**Next Steps:**
1. Continue with Phase 4 - Test all interactions on different input devices
2. Polish visual feedback and animations
3. Add undo/redo support for position changes

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
