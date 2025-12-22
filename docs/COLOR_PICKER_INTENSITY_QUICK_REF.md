# Color Picker Intensity Scaling - Quick Reference

**Status**: Ready for Phase 1 Implementation
**Full Plan**: See `COLOR_PICKER_INTENSITY_SCALING_PLAN.md`
**Previous Work**: PR #98 merged successfully

---

## The Bug (In Brief)

Color pickers (Channel List & 2D Layout) use intensity-scaled RGB as base color for fixtures with INTENSITY channels. This makes the intensity slider unable to reach full brightness.

**Example**:
- Fixture: RED=255, INTENSITY=128 (50% brightness)
- Bug: Base color is {r:128, g:0, b:0} (scaled)
- Result: Slider at 100% → RED=128, INTENSITY=255 (still 50% brightness!)
- Expected: Slider at 100% → RED=255, INTENSITY=255 (full brightness)

---

## Decisions Summary

| Decision Point | Choice |
|----------------|--------|
| **User Expectation** | Hybrid: WITH INTENSITY → control INTENSITY channel; WITHOUT → scale RGB |
| **RGB Extraction** | Modify `channelValuesToRgb()` with optional parameters |
| **Mixed Selections** | Disable color picker, show tooltip explaining why |
| **Slider Range** | 0-100% of INTENSITY channel DMX range (0-255) |
| **Color Source** | Extract raw channel values from `fixtureValues`, don't unscale |

---

## 4-Phase Rollout Plan

### Phase 1: Foundation (2-3 hours) 🎯 START HERE
**Files**: `colorConversion.ts` + 3 call sites

**Breaking Change**: Update `channelValuesToRgb()` to return `{ r, g, b, intensity }`
- Always returns UNSCALED RGB + intensity separately
- No optional parameters needed (we control all 3 call sites!)
- Cleaner API: function always does the same thing

**Call Sites to Update**:
1. `LayoutCanvas.tsx:321` - Apply intensity for display
2. `MultiSelectControls.tsx:112` - Apply intensity for display
3. `ChannelListEditor.tsx:719` - Use unscaled + separate intensity

**Deliverables**:
- ✅ New `RGBColorWithIntensity` interface exported
- ✅ Function returns unscaled RGB + intensity
- ✅ All 3 call sites updated and working
- ✅ Comprehensive unit tests (>90% coverage)
- ✅ Updated JSDoc documentation
- ✅ All existing tests pass

### Phase 2: Single Fixture (1-2 hours)
**File**: `src/components/ChannelListEditor.tsx`

**Note**: `handleColorSwatchClick` already updated in Phase 1!
Just need to verify behavior and add tests.

**Verify**:
- ✅ Line 719: Already gets unscaled RGB + intensity from Phase 1 changes
- ✅ Line 726: `tempColor` now stores unscaled RGB
- ✅ Line 727: `tempIntensity` gets intensity from function
- ✅ No additional code changes needed!

**Tests to add**:
- RGB fixture: intensity defaults to 1.0
- RGB+I fixture at 50%: color unscaled, intensity 0.5
- Intensity 0%→100%: full brightness restored
- Verify actual channel values (not just callbacks)

### Phase 3: Multi Fixture (3-4 hours)
**File**: `src/components/MultiSelectControls.tsx`

**Changes**:
- Add `hasMixedIntensityChannels` detection
- Disable color picker button when mixed
- Update `handleOpenColorPicker` to extract unscaled RGB
- Add tooltip for disabled state

**Tests**:
- Single RGB fixtures work
- Single RGB+I fixtures work
- Mixed selections disable picker

### Phase 4: Polish (1-2 hours)
- Update all documentation
- UI enhancements (tooltips, badges)
- Performance testing
- Final review

---

## Key Implementation Notes

### Extract Raw RGB (Don't Unscale)
```typescript
// ✅ CORRECT
const redChannel = channels.find(ch => ch.type === ChannelType.RED);
const baseColor = { r: redChannel?.value ?? 0, g: ..., b: ... };

// ❌ WRONG
const baseColor = { r: displayRgbColor.r / intensity };  // Can exceed 255!
```

### Detect Mixed Selections
```typescript
const hasMixedIntensityChannels = useMemo(() => {
  const withIntensity = selectedFixtures.filter(f =>
    f.channels?.some(ch => ch.type === ChannelType.INTENSITY)
  );
  return withIntensity.length > 0 &&
         withIntensity.length < selectedFixtures.length;
}, [selectedFixtures]);
```

### Test Actual Values (Not Just Callbacks)
```typescript
// ✅ GOOD TEST
expect(mockOnBatchedChannelChanges).toHaveBeenCalledWith(
  expect.arrayContaining([
    { fixtureId: 'f1', channelIndex: 0, value: 255 },  // RED
    { fixtureId: 'f1', channelIndex: 3, value: 255 },  // INTENSITY
  ])
);

// ❌ WEAK TEST
expect(mockOnBatchedChannelChanges).toHaveBeenCalled();  // Doesn't verify values!
```

---

## Files Modified by Phase

| Phase | Files | Lines Changed (Est) |
|-------|-------|---------------------|
| 1 | `colorConversion.ts` + 3 call sites + tests | ~200 |
| 2 | `ChannelListEditor.test.tsx` only | ~50 |
| 3 | `MultiSelectControls.tsx` + tests | ~120 |
| 4 | Documentation, UI enhancements | ~50 |

**Total**: ~420 lines across 4 PRs

**Note**: Phase 1 is larger because it updates the utility function + all 3 call sites in one PR. Phase 2 is smaller (just tests) since the code is already fixed by Phase 1!

---

## Starting a New Conversation

### For Phase 1:
```
continue

Context: Implement Phase 1 of COLOR_PICKER_INTENSITY_SCALING_PLAN.md
- Enhance channelValuesToRgb() with optional parameters
- Add unit tests for new behavior
- Maintain backward compatibility

Current branch: main (latest)
Need to: Create new feature branch for this work
```

### For Phase 2:
```
continue - Phase 2: Fix ChannelListEditor

Previous: Phase 1 completed and merged
Current: Implement single-fixture color picker fix
See: COLOR_PICKER_INTENSITY_QUICK_REF.md Phase 2 section
```

---

## Success Criteria

- [ ] RGB fixtures: Intensity slider scales RGB (existing behavior preserved)
- [ ] RGB+I fixtures: Intensity slider adjusts INTENSITY channel
- [ ] Intensity 0%→100% restores full brightness for RGB+I
- [ ] Mixed selections: Color picker disabled with clear message
- [ ] All tests pass with >90% coverage of new code
- [ ] No performance regression (<5ms for typical selections)
- [ ] Backward compatibility: Existing callers unchanged

---

**Next Step**: Create feature branch and start Phase 1
**Estimated Total**: 8-12 hours across 4 PRs
**Full Details**: `COLOR_PICKER_INTENSITY_SCALING_PLAN.md`
