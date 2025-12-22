# Release Notes: Color Picker Intensity Slider Fix

**Version**: Included in v0.8.11 and later
**Release Date**: December 22, 2025
**Related PRs**: #99, #100, #102
**Impact**: Bug Fix - Improved User Experience

---

## Summary

Fixed a critical bug in the color picker where the intensity slider would not properly restore full brightness for fixtures with a dedicated INTENSITY channel (RGB+I fixtures). The intensity slider now works correctly for all fixture types.

---

## What Was Fixed

### The Problem

When using the color picker's intensity slider with fixtures that have a dedicated INTENSITY channel (such as RGB+I fixtures), the slider would not properly restore full brightness:

**Before the fix:**
1. Fixture at: `RED=255, INTENSITY=128` (50% brightness - dim red)
2. User opens color picker and sees intensity slider at 50%
3. User moves intensity slider to 100%
4. **Bug**: Fixture stays at 50% brightness (`RED=128, INTENSITY=255`)
5. **User sees no increase in brightness** ❌

**After the fix:**
1. Fixture at: `RED=255, INTENSITY=128` (50% brightness - dim red)
2. User opens color picker and sees intensity slider at 50%
3. User moves intensity slider to 100%
4. **Fixed**: Fixture goes to full brightness (`RED=255, INTENSITY=255`)
5. **User sees full bright red** ✅

### Root Cause

The color picker was initializing with intensity-**scaled** RGB values instead of the raw channel values. This caused the intensity slider to operate on already-dimmed colors, making it impossible to restore full brightness.

---

## What Changed

### For RGB+I Fixtures (with INTENSITY channel)

**Before:** Intensity slider would scale already-scaled RGB values (double-scaling bug)
**After:** Intensity slider directly controls the INTENSITY channel (0-255)

**User Impact:**
- ✅ Moving intensity from 0% to 100% now correctly restores full brightness
- ✅ Intensity slider shows the actual INTENSITY channel value
- ✅ Color is preserved when adjusting intensity

### For RGB-Only Fixtures (without INTENSITY channel)

**No Change:** Intensity slider continues to scale RGB channel values proportionally (existing behavior preserved)

**User Impact:**
- ✅ Existing workflows continue to work exactly as before
- ✅ No retraining needed for RGB-only fixtures

---

## User-Facing Changes

### 1. **Intensity Slider Now Works Correctly** ✅

For fixtures with an INTENSITY channel:
- Slider accurately represents current brightness
- Moving to 100% always gives full brightness
- Moving to 0% dims to black
- Moving back to 100% restores full brightness

### 2. **Color Preservation** ✅

Previously, some color information could be lost when:
- Moving intensity to 0% then back to 100%
- Adjusting intensity multiple times

Now, the base color is always preserved regardless of intensity changes.

### 3. **Multi-Fixture Selection** ✅

When multiple fixtures are selected in the 2D Layout:
- Color picker uses the first fixture's intensity as the initial value
- All selected fixtures update together when intensity changes
- Fixtures with different intensity capabilities are handled correctly

---

## Technical Details

### Changes Made

1. **src/utils/colorConversion.ts**
   - Modified `channelValuesToRgb()` to return unscaled RGB + intensity
   - Added `applyIntensityToRgb()` helper function
   - New return type: `RGBColorWithIntensity`

2. **src/components/MultiSelectControls.tsx**
   - Updated `handleOpenColorPicker` to use unscaled RGB values
   - Intensity slider now properly controls INTENSITY channel

3. **src/components/ChannelListEditor.tsx**
   - Already using unscaled RGB values (completed in Phase 1)
   - No user-visible changes

### Testing

- Added 5 comprehensive tests for intensity scaling behavior
- Tested RGB-only fixtures (no regression)
- Tested RGB+I fixtures at various intensity levels (0%, 50%, 100%)
- All existing tests continue to pass

---

## Migration Notes

### For End Users

**No action required.** This is a bug fix that improves existing functionality. Your scenes, cue lists, and fixture configurations are not affected.

### Expected Behavior Changes

If you have been working around the intensity slider bug by:
- Manually adjusting INTENSITY channel in the channel list
- Avoiding the intensity slider entirely
- Using workarounds to restore brightness

You can now:
- ✅ Use the intensity slider normally
- ✅ Rely on 0%→100% intensity restoration
- ✅ Adjust intensity in the color picker with confidence

---

## Examples

### Example 1: Single Fixture with INTENSITY Channel

**Fixture**: RGB+I LED Par (RED, GREEN, BLUE, INTENSITY channels)

**Scenario**: Set fixture to dim red, then restore to full brightness

```
1. Set color to RED in color picker
2. Move intensity slider to 50%
   Result: RED=255, INTENSITY=128 (dim red)
3. Move intensity slider to 100%
   Result: RED=255, INTENSITY=255 (bright red) ✅
```

### Example 2: RGB-Only Fixture

**Fixture**: RGB LED Strip (RED, GREEN, BLUE channels only)

**Scenario**: Adjust brightness using intensity slider

```
1. Set color to RED in color picker
2. Move intensity slider to 50%
   Result: RED=128, GREEN=0, BLUE=0 (dim red)
3. Move intensity slider to 100%
   Result: RED=255, GREEN=0, BLUE=0 (bright red) ✅
```

### Example 3: Mixed Fixture Selection

**Fixtures**: 2× RGB+I fixtures selected in 2D Layout

**Scenario**: Change color and intensity for multiple fixtures

```
1. Select both fixtures
2. Open color picker
   Color picker shows first fixture's color and intensity
3. Change color to BLUE and intensity to 75%
   Result: Both fixtures → BLUE at 75% brightness ✅
```

---

## Known Limitations

### 1. Multi-Fixture Mixed Types

When selecting both RGB-only and RGB+I fixtures together:
- Color picker uses the first fixture's characteristics
- Intensity slider behaves according to the first fixture's type
- This is by design to keep behavior predictable

### 2. Fixtures with Multiple Intensity Channels

Some fixtures have multiple intensity-like channels (INTENSITY, DIMMER, STROBE):
- Only the INTENSITY channel is controlled by the slider
- Other channels must be adjusted manually in the channel list

---

## Frequently Asked Questions

### Q: Will this affect my existing scenes?

**A:** No. This fix only affects live editing in the color picker. Saved scenes are not modified and will play back exactly as before.

### Q: Do I need to re-save my scenes?

**A:** No. Your existing scenes are fine. However, you may want to use the fixed color picker to create new scenes with more precise intensity control.

### Q: Why does the intensity slider behave differently for different fixtures?

**A:** Fixtures have different channel configurations:
- RGB+I fixtures have a dedicated INTENSITY channel that controls brightness
- RGB-only fixtures don't have an INTENSITY channel, so intensity is simulated by scaling RGB values

The color picker automatically detects your fixture type and uses the appropriate method.

### Q: What if I have a fixture with RGBW channels?

**A:** RGBW fixtures (with White channel but no INTENSITY) behave like RGB fixtures - the intensity slider scales all color channels including White.

---

## Feedback

If you encounter any issues with the intensity slider or color picker after this update, please report them on GitHub:

**Repository**: https://github.com/bbernstein/lacylights-fe/issues

Include:
- Fixture type (manufacturer, model, channels)
- Steps to reproduce
- Expected vs. actual behavior

---

## References

- **Planning Document**: `docs/COLOR_PICKER_INTENSITY_SCALING_PLAN.md`
- **Phase 1 PR**: #99 - Utility function changes
- **Phase 3 PR**: #100 - MultiSelectControls fix
- **Phase 4 PR**: #102 - Documentation updates
- **Related Issue**: Intensity slider not restoring full brightness

---

**Last Updated**: 2025-12-22
**Authors**: Claude Sonnet 4.5 (via Claude Code)
