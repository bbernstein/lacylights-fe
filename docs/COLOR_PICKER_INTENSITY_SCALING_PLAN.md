# Color Picker Intensity Scaling Fix Plan

## Status: READY FOR IMPLEMENTATION ✅

**Branch**: Create new branch from latest `main`
**Previous Work**: PR #98 merged successfully
**Estimated Effort**: 8-12 hours across 4 PRs

---

## Decisions Made

The following architectural decisions have been finalized:

1. **User Expectation** → **Hybrid Approach**
   - Fixtures WITH INTENSITY channel: Slider controls INTENSITY channel (0-255 DMX range)
   - Fixtures WITHOUT INTENSITY channel: Slider scales RGB values (existing behavior)

2. **RGB Extraction** → **Modified `channelValuesToRgb()`**
   - Add optional parameters to control intensity scaling behavior
   - Maintain backward compatibility with default parameters

3. **Mixed Selections** → **Disable Color Picker**
   - When fixtures with and without INTENSITY channels are selected together, disable/hide the color picker button
   - Show clear UI message explaining why picker is unavailable
   - Simpler and safer than trying to handle mixed behavior

4. **Intensity Slider Range** → **Absolute DMX Range**
   - For fixtures WITH INTENSITY channel: Slider shows 0-100% of full DMX range (0-255)
   - Slider position represents absolute INTENSITY channel value, not relative to current

5. **Color Extraction** → **Direct from fixtureValues**
   - Extract raw RGB channel values directly from `fixtureValues` map
   - Don't attempt to "unscale" displayRgbColor - just read the raw channel values
   - Cleaner and more reliable than mathematical unscaling

---

## Executive Summary

The color picker intensity slider has a fundamental bug when used with fixtures that have a dedicated INTENSITY channel. The issue affects both single-fixture selection (ChannelListEditor) and multi-fixture selection (MultiSelectControls). This document outlines the problem, architectural decisions, and implementation plan.

---

## Problem Statement

### The Bug

When a fixture has an INTENSITY channel, the color picker initializes with an intensity-**scaled** color instead of the raw RGB values. This causes the intensity slider to operate on already-scaled values, resulting in incorrect brightness levels.

**Example Scenario:**
1. Fixture state: RED=255, INTENSITY=128 (displaying as 50% brightness red)
2. User opens color picker
3. **Current behavior**:
   - Base color set to {r: 128, g: 0, b: 0} (scaled)
   - Intensity slider shows 50%
   - User moves slider to 100%
   - Result: RED=128, INTENSITY=255 (50% brightness displayed at full)
   - **User sees no change in brightness!**
4. **Expected behavior**:
   - Base color should be {r: 255, g: 0, b: 0} (unscaled)
   - Intensity slider shows 50%
   - User moves slider to 100%
   - Result: RED=255, INTENSITY=255 (100% brightness)
   - **User sees full bright red**

### Root Cause

The `channelValuesToRgb()` function in `src/utils/colorConversion.ts` applies intensity scaling when an INTENSITY channel is present:

```typescript
// Lines 632-637 in colorConversion.ts
// Apply intensity if present
if (hasIntensity) {
  r *= intensity;  // Scales RGB by INTENSITY channel value
  g *= intensity;
  b *= intensity;
}
```

Both color pickers use this function to get the display color, then store that scaled color as the base for the intensity slider.

---

## Scope of Impact

### Affected Components

1. **MultiSelectControls.tsx** (2D Layout multi-select)
   - Lines 82-114: Calculates `displayRgbColor` using `channelValuesToRgb()`
   - Lines 209-214: `handleOpenColorPicker` stores scaled `displayRgbColor` as `baseColorForIntensity`
   - Lines 225-270: `handleIntensityChange` uses scaled base color

2. **ChannelListEditor.tsx** (Channel List single-select)
   - Lines 708-729: `handleColorSwatchClick` uses `channelValuesToRgb()` for `currentColor`
   - Line 726: `setTempColor(currentColor)` stores scaled color
   - Lines 746-753: `handleIntensityChange` uses scaled `tempColor`

### User Impact

**Fixtures WITHOUT INTENSITY channel:**
- ✅ Works correctly (RGB channels scaled directly)

**Fixtures WITH INTENSITY channel:**
- ❌ Intensity slider produces incorrect brightness
- ❌ Moving slider to 100% doesn't give full brightness
- ❌ Color restoration after 0%→100% loses original intensity

**Mixed selections** (MultiSelectControls only):
- ❌ Unpredictable behavior with mixed fixture types

---

## Implementation Details Based on Decisions

### 1. Hybrid Intensity Slider Behavior (DECISION: Hybrid Approach)

**For fixtures WITH INTENSITY channel:**
- Intensity slider controls the INTENSITY channel directly (0-255 DMX range)
- RGB channels remain at their set values (user-chosen color)
- Example: RED=255, user moves intensity slider to 50% → RED=255, INTENSITY=128

**For fixtures WITHOUT INTENSITY channel:**
- Intensity slider scales RGB channel values proportionally (existing behavior)
- Example: RGB=(255,0,0), user moves intensity slider to 50% → RGB=(128,0,0)

**Implementation approach:**
- Detect presence of INTENSITY channel when opening color picker
- Store fixture type flag to determine intensity application method
- Use `createOptimizedColorMapping()` which already handles both cases

### 2. RGB Extraction Method (DECISION: Modified channelValuesToRgb - Breaking Change)

**Approach**: Change `channelValuesToRgb()` to ALWAYS return unscaled RGB + intensity

Since we control all call sites in the repo (only 3 places), we can make a clean breaking change:

```typescript
// OLD signature
channelValuesToRgb(channels: InstanceChannelWithValue[]): RGBColor

// NEW signature
channelValuesToRgb(channels: InstanceChannelWithValue[]): RGBColorWithIntensity

interface RGBColorWithIntensity {
  r: number;      // Unscaled RGB (0-255)
  g: number;
  b: number;
  intensity: number;  // 0-1 (normalized from INTENSITY channel or 1.0 if none)
}
```

**Call Sites to Update** (3 total):
1. `LayoutCanvas.tsx:321` - Display color → Apply intensity scaling
2. `MultiSelectControls.tsx:112` - Display color → Apply intensity scaling
3. `ChannelListEditor.tsx:719` - Color picker init → Use unscaled + intensity separately

**Benefits:**
- Cleaner API - function always does the same thing
- Single source of truth for intensity extraction
- No optional parameters or behavior flags
- Caller explicitly chooses to scale or not
- Type-safe with TypeScript

**Implementation:**
- Remove lines 632-637 (intensity scaling)
- Change return type to include `intensity: number`
- Update all 3 call sites to handle new return type

### 3. Mixed Selection Handling (DECISION: Disable Color Picker)

**When to disable:**
- Selection includes both RGB-only and RGB+I fixtures
- Easy detection: Check if SOME but not ALL fixtures have INTENSITY channel

**UI Changes:**
```typescript
// In MultiSelectControls
const hasMixedIntensityChannels = useMemo(() => {
  const withIntensity = selectedFixtures.filter(f =>
    f.channels?.some(ch => ch.type === ChannelType.INTENSITY)
  );
  return withIntensity.length > 0 && withIntensity.length < selectedFixtures.length;
}, [selectedFixtures]);

// Disable color picker button if mixed
<button disabled={hasMixedIntensityChannels} title={...}>
```

**User feedback:**
- Tooltip: "Color picker unavailable: Mixed fixture types selected (some with INTENSITY channel, some without)"
- Optional: Badge or icon indicating mixed selection

### 4. Intensity Slider Semantics (DECISION: Absolute DMX Range)

**For RGB+I fixtures:**
- Slider represents 0-100% of INTENSITY channel's full DMX range (0-255)
- If INTENSITY currently at 128, slider shows at 50% position
- Moving slider to 75% sets INTENSITY to 192 (0.75 × 255)

**Implementation:**
- When opening picker: `intensity = intensityChannel.value / 255`
- When applying: `newIntensityValue = sliderValue × 255`
- No special handling needed - already works this way

### 5. Color Extraction (DECISION: Direct from fixtureValues)

**Approach**: Read raw channel values directly, don't use scaled displayRgbColor

```typescript
// CORRECT: Get unscaled RGB by reading channels directly
const redChannel = channels.find(ch => ch.type === ChannelType.RED);
const greenChannel = channels.find(ch => ch.type === ChannelType.GREEN);
const blueChannel = channels.find(ch => ch.type === ChannelType.BLUE);

const baseColor = {
  r: redChannel?.value ?? 0,
  g: greenChannel?.value ?? 0,
  b: blueChannel?.value ?? 0,
};

// WRONG: Don't try to unscale displayRgbColor
// const baseColor = {
//   r: displayRgbColor.r / intensity,  // ❌ Can exceed 255!
//   g: displayRgbColor.g / intensity,
//   b: displayRgbColor.b / intensity,
// };
```

**Benefits:**
- Simple and direct
- No mathematical edge cases (division by zero, exceeding 255)
- Clear intent in code

---

## Recommended Solution

### High-Level Approach

1. **Modify color picker initialization** to extract unscaled RGB values
2. **Separate intensity source** based on fixture capabilities
3. **Update intensity change handlers** to use correct base color
4. **Add comprehensive tests** for both fixture types

### Implementation Steps

#### Phase 1: Utility Function Enhancement

**Files**:
- `src/utils/colorConversion.ts` - Function changes
- `src/components/LayoutCanvas.tsx` - Update call site
- `src/components/MultiSelectControls.tsx` - Update call site
- `src/components/ChannelListEditor.tsx` - Update call site

**Step 1: Add new return type**
```typescript
// In colorConversion.ts
export interface RGBColorWithIntensity {
  r: number;      // Unscaled RGB value (0-255)
  g: number;
  b: number;
  intensity: number;  // Normalized intensity (0-1), 1.0 if no INTENSITY channel
}
```

**Step 2: Modify channelValuesToRgb()**
```typescript
/**
 * Converts channel values to RGB color and intensity.
 * Returns UNSCALED RGB values (raw channel values, not multiplied by intensity).
 *
 * For fixtures WITH an INTENSITY channel:
 *   - RGB values are the raw channel values (e.g., RED=255)
 *   - intensity is the INTENSITY channel value normalized to 0-1 (e.g., 128/255 = 0.5)
 *
 * For fixtures WITHOUT an INTENSITY channel:
 *   - RGB values are the channel values (e.g., RED=128)
 *   - intensity is always 1.0
 *
 * To get display color (what user sees), multiply RGB by intensity:
 *   displayR = r * intensity
 *
 * @param channels - Array of channels with current values
 * @returns Unscaled RGB color + intensity value
 */
export function channelValuesToRgb(
  channels: InstanceChannelWithValue[]
): RGBColorWithIntensity {
  // ... existing color extraction logic ...

  // Check for intensity channel
  const intensityChannel = channels.find(channel => channel.type === ChannelType.INTENSITY);
  const intensity = intensityChannel ? intensityChannel.value / 255 : 1.0;

  // REMOVED: Lines 632-637 that applied intensity scaling
  // Now we ALWAYS return unscaled RGB + separate intensity

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
    intensity,
  };
}
```

**Step 3: Update LayoutCanvas.tsx (line 321)**
```typescript
// OLD
const rgb = channelValuesToRgb(channelsWithValues);

// NEW - Apply intensity for display color
const { r, g, b, intensity } = channelValuesToRgb(channelsWithValues);
const rgb = {
  r: Math.round(r * intensity),
  g: Math.round(g * intensity),
  b: Math.round(b * intensity),
};
```

**Step 4: Update MultiSelectControls.tsx (line 112)**
```typescript
// OLD
const rgb = channelValuesToRgb(channelsWithValues);
return rgb;

// NEW - Apply intensity for display color
const { r, g, b, intensity } = channelValuesToRgb(channelsWithValues);
return {
  r: Math.round(r * intensity),
  g: Math.round(g * intensity),
  b: Math.round(b * intensity),
};
```

**Step 5: Update ChannelListEditor.tsx (line 719)**
```typescript
// OLD
const currentColor = channelValuesToRgb(channels);

// NEW - Use unscaled color and separate intensity
const { r, g, b, intensity } = channelValuesToRgb(channels);
const currentColor = { r, g, b };  // Unscaled for color picker base
const currentIntensity = intensity;

// Remove lines 722-723 (old intensity extraction)
// Now we get intensity from channelValuesToRgb()
```

**Tests to add**:
- ✅ RGB fixture without INTENSITY: returns RGB values, intensity=1.0
- ✅ RGB+I fixture at INTENSITY=128: returns unscaled RGB, intensity=0.5
- ✅ RGB+I fixture at INTENSITY=0: returns unscaled RGB, intensity=0
- ✅ RGB+I fixture at INTENSITY=255: returns unscaled RGB, intensity=1.0
- ✅ Display color calculation: unscaled × intensity = correct display color

#### Phase 2: ChannelListEditor Fix

**File**: `src/components/ChannelListEditor.tsx`

```typescript
// Line 708: handleColorSwatchClick
const handleColorSwatchClick = (fixtureId: string) => {
  const fixtureValue = activeFixtureValues.find((fv: SceneFixtureValue) => fv.fixture.id === fixtureId);
  if (!fixtureValue) return;

  const channels = (fixtureValue.fixture.channels || []).map((channelDef: InstanceChannel, index: number) => ({
    ...channelDef,
    value: channelValues.get(fixtureId)?.[index] ?? 0,
  }));

  // Get UNSCALED color and separate intensity value
  const { r, g, b, intensity } = channelValuesToRgb(channels, {
    applyIntensityScaling: false,  // Don't scale RGB by intensity
    returnIntensity: true,          // Get intensity value separately
  });

  const unscaledColor = { r, g, b };
  const currentIntensity = intensity ?? 1.0;

  setSelectedFixtureId(fixtureId);
  setTempColor(unscaledColor);           // Store UNSCALED color
  setTempIntensity(currentIntensity);
  setColorPickerOpen(true);
};
```

**No changes needed** to `handleIntensityChange` - it already uses `tempColor` and `tempIntensity` correctly.

**Tests to add**:
- ✅ Open picker for RGB fixture: intensity defaults to 1.0
- ✅ Open picker for RGB+I fixture at 50%: intensity is 0.5, color is unscaled
- ✅ Move intensity 0%→100%: fixture returns to full brightness
- ✅ Verify actual channel values after intensity change (not just callbacks)

#### Phase 3: MultiSelectControls Fix

**File**: `src/components/MultiSelectControls.tsx`

```typescript
// Line 82: Update displayRgbColor calculation
const displayRgbColor = useMemo(() => {
  if (selectedFixtures.length === 0 || mergedChannels.length === 0) return null;

  const firstFixture = selectedFixtures[0];
  const firstFixtureValues = fixtureValues.get(firstFixture.id);
  if (!firstFixtureValues || !firstFixture.channels) return null;

  const channelsWithValues: InstanceChannelWithValue[] = firstFixture.channels.map((channel, index) => {
    const mergedChannel = mergedChannels.find(
      (mc) => mc.type === channel.type && mc.fixtureIds.includes(firstFixture.id)
    );

    let value = firstFixtureValues[index] || 0;
    if (mergedChannel) {
      const localValue = localSliderValues.get(getChannelKey(mergedChannel));
      if (localValue !== undefined) {
        value = localValue;
      }
    }

    return { ...channel, value };
  });

  // Get RGB with intensity scaling for display purposes
  const rgb = channelValuesToRgb(channelsWithValues, {
    applyIntensityScaling: true,  // Apply scaling for display
  });
  return rgb;
}, [selectedFixtures, fixtureValues, mergedChannels, localSliderValues]);

// Line 43: Add unscaledBaseColor state
const [baseColorForIntensity, setBaseColorForIntensity] = useState<{
  r: number;
  g: number;
  b: number;
} | null>(null);

// Line 43a: Track current intensity separately
const [colorPickerIntensity, setColorPickerIntensity] = useState(1.0);

// Line 209: Update handleOpenColorPicker
const handleOpenColorPicker = useCallback(() => {
  if (!displayRgbColor) return;

  // Get unscaled base color and intensity from first fixture
  const firstFixture = selectedFixtures[0];
  const firstFixtureValues = fixtureValues.get(firstFixture.id);
  if (!firstFixtureValues || !firstFixture.channels) return;

  const channelsWithValues: InstanceChannelWithValue[] = firstFixture.channels.map((channel, index) => ({
    ...channel,
    value: firstFixtureValues[index] || 0,
  }));

  const { r, g, b, intensity } = channelValuesToRgb(channelsWithValues, {
    applyIntensityScaling: false,  // Get unscaled RGB
    returnIntensity: true,          // Get intensity separately
  });

  setBaseColorForIntensity({ r, g, b });  // Store UNSCALED color
  setColorPickerIntensity(intensity ?? 1.0);
  setIsColorPickerOpen(true);
}, [displayRgbColor, selectedFixtures, fixtureValues]);
```

**No changes needed** to `handleIntensityChange`, `handleColorPickerChange`, or shared helper - they already use the base color and intensity correctly.

**Tests to add**:
- ✅ Multi-select RGB fixtures: intensity defaults to 1.0
- ✅ Multi-select RGB+I fixtures: uses first fixture's intensity
- ✅ Mixed selection (RGB + RGB+I): clear indication in UI
- ✅ Intensity 0%→100% restores full brightness for RGB+I fixtures
- ✅ Verify channel values, not just callback invocations

#### Phase 4: Documentation Updates

1. **Update JSDoc** for `channelValuesToRgb()` to explain intensity scaling behavior
2. **Update component comments** explaining unscaled color storage
3. **Add inline comments** explaining the fixture type handling
4. **Update this plan** with actual implementation results

#### Phase 5: UI Enhancement (Optional)

Consider adding UI indicators for mixed selections:
- Badge showing "Mixed fixture types" when selection has both RGB and RGB+I
- Tooltip explaining intensity slider behavior for current selection
- Warning if intensity slider will have unexpected behavior

---

## Testing Strategy

### Unit Tests

**colorConversion.ts**:
- Test `channelValuesToRgb` with `applyIntensityScaling` option
- Test `returnIntensity` option returns correct value
- Test backward compatibility (default parameters)

**ChannelListEditor.tsx**:
- Test color picker opens with unscaled color for RGB+I fixture
- Test intensity value correctly extracted
- Test intensity changes produce correct channel updates
- **Critical**: Verify actual channel values in assertions

**MultiSelectControls.tsx**:
- Test single RGB fixture selection
- Test single RGB+I fixture selection
- Test mixed RGB and RGB+I selection
- Test intensity slider at various positions (0%, 50%, 100%)
- **Critical**: Verify actual channel values, not just callbacks

### Integration Tests

Test full user workflows:
1. Open picker → change color → adjust intensity → apply
2. RGB fixture: verify RGB channels scaled, no INTENSITY channel touched
3. RGB+I fixture: verify RGB at full, INTENSITY channel adjusted
4. Intensity 0%→100%: verify returns to full brightness

### Manual Testing Scenarios

**Scenario 1: Single RGB+I Fixture**
- Create fixture with RED, GREEN, BLUE, INTENSITY channels
- Set RED=255, INTENSITY=128 (50% brightness)
- Open color picker from Channel List
- Verify: Swatch shows dim red, intensity slider at 50%
- Move intensity to 100%
- Verify: RED=255, INTENSITY=255, fixture shows full bright red

**Scenario 2: Multiple RGB+I Fixtures**
- Select 2+ fixtures with INTENSITY channels
- Set different intensities (e.g., 128, 192)
- Open color picker from 2D Layout
- Verify: Uses first fixture's intensity
- Change intensity to 255
- Verify: All fixtures update to INTENSITY=255

**Scenario 3: Mixed Selection**
- Select 1 RGB fixture + 1 RGB+I fixture
- Open color picker from 2D Layout
- Change intensity slider
- Verify: RGB fixture scales RGB channels, RGB+I adjusts INTENSITY

---

## Risks and Mitigations

### Risk 1: Breaking Existing Behavior

**Risk**: Changing `channelValuesToRgb` could break other callers

**Mitigation**:
- Use optional parameters with safe defaults
- Add tests for backward compatibility
- Audit all usages of `channelValuesToRgb` in codebase

### Risk 2: User Confusion with Mixed Selections

**Risk**: Mixed RGB/RGB+I selections have unpredictable behavior

**Mitigation**:
- Add UI indicator for mixed selections
- Consider documenting behavior in user guide
- Future: Enhance to handle mixed selections intelligently

### Risk 3: Scene Compatibility

**Risk**: Existing scenes might rely on current (buggy) behavior

**Mitigation**:
- Current bug only affects live editing, not playback
- No scene data format changes required
- Document behavior change in release notes

### Risk 4: Performance Impact

**Risk**: Additional parameter checking in hot path

**Mitigation**:
- Parameter destructuring is negligible overhead
- Intensity scaling logic unchanged
- No additional loops or allocations

---

## Rollout Plan

### Stage 1: Foundation (PR #1)
- Enhance `channelValuesToRgb` with options parameter
- Add comprehensive unit tests
- No UI changes yet

### Stage 2: Single Fixture Fix (PR #2)
- Fix ChannelListEditor color picker
- Add component tests
- Manual testing with single fixtures

### Stage 3: Multi Fixture Fix (PR #3)
- Fix MultiSelectControls color picker
- Add component tests
- Manual testing with multiple fixtures

### Stage 4: Polish (PR #4)
- Update documentation
- Add UI indicators for edge cases
- Performance testing with large selections

---

## Success Criteria

### Functional Requirements
- ✅ RGB fixtures: Intensity slider scales RGB channels (existing behavior preserved)
- ✅ RGB+I fixtures: Intensity slider adjusts INTENSITY channel
- ✅ Moving intensity 0%→100% restores full brightness for RGB+I fixtures
- ✅ Color picker shows correct initial intensity for all fixture types

### Quality Requirements
- ✅ All existing tests pass
- ✅ New tests achieve >90% coverage of modified code
- ✅ No regressions in Channel List or 2D Layout views
- ✅ Performance impact <5ms for typical selections

### Documentation Requirements
- ✅ JSDoc updated for all modified functions
- ✅ This plan document updated with implementation notes
- ✅ Inline comments explain intensity scaling logic
- ✅ User-facing release notes document behavior change

---

## Timeline Estimate

- **Stage 1** (Foundation): 2-3 hours
  - Update colorConversion.ts
  - Write unit tests
  - Review and test backward compatibility

- **Stage 2** (Single Fixture): 2-3 hours
  - Update ChannelListEditor
  - Write component tests
  - Manual testing

- **Stage 3** (Multi Fixture): 3-4 hours
  - Update MultiSelectControls
  - Write component tests
  - Manual testing with mixed selections

- **Stage 4** (Polish): 1-2 hours
  - Documentation
  - UI enhancements
  - Final review

**Total**: 8-12 hours of development time across 4 PRs

---

## Open Questions

1. **Should we disable color picker for mixed RGB/RGB+I selections?**
   - Current plan: Allow but use first fixture's type
   - Alternative: Show warning or disable picker

2. **Should intensity slider be disabled for RGB fixtures?**
   - Current plan: Allow slider to scale RGB
   - Alternative: Hide slider, only show color wheel

3. **How to handle fixtures with multiple intensity-like channels?**
   - Example: INTENSITY + DIMMER + STROBE
   - Current plan: Only use INTENSITY channel
   - Alternative: Combine or prioritize

4. **Should we add visual feedback for intensity scaling mode?**
   - Icon or label showing "Intensity channel" vs "RGB scaling"
   - Tooltip explaining current behavior

---

## Future Enhancements

1. **Smart Mixed Selection Handling**
   - Detect common channel types across selection
   - Apply appropriate scaling for each fixture type
   - Show preview of resulting changes

2. **Color Space Improvements**
   - Support HSV/HSL color picker modes
   - Better handling of extended color channels (RGBWAU)
   - Roscolux gel integration with intensity

3. **Preset Management**
   - Save color + intensity presets
   - Apply presets to mixed selections
   - Import/export preset libraries

4. **Advanced Intensity Controls**
   - Curve adjustment (linear/exponential/S-curve)
   - Group link (maintain relative intensities)
   - Fade profiles per fixture type

---

## References

- **Original Bug Report**: PR #98 issue description
- **Copilot Review**: Comment 3682573110 and subsequent reviews
- **Related Code**:
  - `src/utils/colorConversion.ts`: `channelValuesToRgb()` function
  - `src/components/ChannelListEditor.tsx`: Lines 708-753
  - `src/components/MultiSelectControls.tsx`: Lines 82-270
- **Type Definitions**: `src/types/index.ts`: `ChannelType`, `InstanceChannel`

---

## Appendix: Code Audit

### All Usages of `channelValuesToRgb()`

Run this search to find all callers that need review:
```bash
grep -rn "channelValuesToRgb" src/
```

**Known usages**:
1. ✅ `MultiSelectControls.tsx:112` - Display color (needs intensity scaling)
2. ✅ `ChannelListEditor.tsx:719` - Color picker init (needs NO scaling)
3. ⚠️ `LayoutCanvas.tsx` - Fixture display colors (verify behavior)
4. ⚠️ Other components TBD (audit required)

**Action**: Complete audit before implementation to ensure no breaking changes.

---

## Starting Next Conversation

To continue implementing this plan in a new conversation, use this exact message:

```
continue

Context: Implement Phase 1 of COLOR_PICKER_INTENSITY_SCALING_PLAN.md
- Enhance channelValuesToRgb() with optional parameters
- Add unit tests for new behavior
- Maintain backward compatibility

Current branch: main (latest)
Need to: Create new feature branch for this work
```

**Important preparation steps:**
1. ✅ Merged PR #98 and deleted branch `fix/color-picker-intensity-slider-live-update`
2. ✅ Checked out latest `main` branch locally
3. ✅ All decisions documented in this plan
4. Ready to create new branch and begin Phase 1

**Phase 1 Goals** (First conversation):
- Modify `src/utils/colorConversion.ts` - add optional parameters to `channelValuesToRgb()`
- Write comprehensive unit tests for new functionality
- Verify backward compatibility (all existing tests pass)
- Document the new parameters with JSDoc
- **Estimated time**: 2-3 hours

**Phase 2-4** (Subsequent conversations):
- Each phase can start with `continue` and reference the next phase number
- Example: "continue - Phase 2: Fix ChannelListEditor"

---

**Document Status**: Ready for Implementation ✅
**Created**: 2025-12-22
**Updated**: 2025-12-22 (Decisions finalized)
**Author**: Claude Sonnet 4.5 (via Claude Code)
**Next Action**: Start Phase 1 implementation in new conversation
