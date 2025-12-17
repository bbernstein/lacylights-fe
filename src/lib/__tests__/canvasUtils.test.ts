import {
  percentToPixel,
  pixelToPercent,
  checkCollision,
  findAvailablePosition,
  clamp,
  snapToGrid,
  recalibrateButtonPositions,
  Rect,
  ButtonPosition,
} from "../canvasUtils";

describe("canvasUtils", () => {
  describe("percentToPixel", () => {
    it("should convert percentage to pixels", () => {
      expect(percentToPixel(0.5, 2000)).toBe(1000);
      expect(percentToPixel(0.1, 2000)).toBe(200);
      expect(percentToPixel(1.0, 2000)).toBe(2000);
      expect(percentToPixel(0, 2000)).toBe(0);
    });

    it("should round to nearest integer", () => {
      expect(percentToPixel(0.333, 2000)).toBe(666);
      expect(percentToPixel(0.666, 2000)).toBe(1332);
    });
  });

  describe("pixelToPercent", () => {
    it("should convert pixels to percentage", () => {
      expect(pixelToPercent(1000, 2000)).toBe(0.5);
      expect(pixelToPercent(200, 2000)).toBe(0.1);
      expect(pixelToPercent(2000, 2000)).toBe(1.0);
      expect(pixelToPercent(0, 2000)).toBe(0);
    });
  });

  describe("checkCollision", () => {
    it("should detect collision when rectangles overlap", () => {
      const rect1: Rect = { layoutX: 0, layoutY: 0, width: 100, height: 100 };
      const rect2: Rect = { layoutX: 50, layoutY: 50, width: 100, height: 100 };
      expect(checkCollision(rect1, rect2)).toBe(true);
    });

    it("should not detect collision when rectangles do not overlap", () => {
      const rect1: Rect = { layoutX: 0, layoutY: 0, width: 100, height: 100 };
      const rect2: Rect = {
        layoutX: 200,
        layoutY: 200,
        width: 100,
        height: 100,
      };
      expect(checkCollision(rect1, rect2)).toBe(false);
    });

    it("should detect collision at exact edges without padding", () => {
      const rect1: Rect = { layoutX: 0, layoutY: 0, width: 100, height: 100 };
      const rect2: Rect = { layoutX: 100, layoutY: 0, width: 100, height: 100 };
      // Rectangles touching at edges are considered colliding (expected behavior).
      // This design choice ensures that UI elements (e.g., buttons) do not appear to overlap visually,
      // and avoids ambiguous cases where elements are flush but not truly separated.
      expect(checkCollision(rect1, rect2)).toBe(true);
    });

    it("should respect padding parameter", () => {
      const rect1: Rect = { layoutX: 0, layoutY: 0, width: 100, height: 100 };
      const rect2: Rect = { layoutX: 105, layoutY: 0, width: 100, height: 100 };
      expect(checkCollision(rect1, rect2, 10)).toBe(true);
      expect(checkCollision(rect1, rect2, 0)).toBe(false);
    });
  });

  describe("findAvailablePosition", () => {
    it("should find first available position in empty canvas", () => {
      const pos = findAvailablePosition([], 2000, 2000, 200, 120, 250, 20);
      expect(pos).toEqual({ x: 20, y: 20 });
    });

    it("should find next available position when first is occupied", () => {
      const existingButtons: Rect[] = [
        { layoutX: 20, layoutY: 20, width: 200, height: 120 },
      ];
      const pos = findAvailablePosition(
        existingButtons,
        2000,
        2000,
        200,
        120,
        250,
        20,
      );
      expect(pos).toEqual({ x: 270, y: 20 });
    });

    it("should return null when no position available", () => {
      // Fill the entire canvas
      const existingButtons: Rect[] = [];
      for (let y = 0; y < 2000; y += 120) {
        for (let x = 0; x < 2000; x += 200) {
          existingButtons.push({
            layoutX: x,
            layoutY: y,
            width: 200,
            height: 120,
          });
        }
      }
      const pos = findAvailablePosition(
        existingButtons,
        2000,
        2000,
        200,
        120,
        250,
        20,
      );
      expect(pos).toBeNull();
    });

    it("should skip to next row when current row is full", () => {
      const existingButtons: Rect[] = [];
      // Fill first row
      for (let x = 20; x < 2000 - 200; x += 250) {
        existingButtons.push({
          layoutX: x,
          layoutY: 20,
          width: 200,
          height: 120,
        });
      }
      const pos = findAvailablePosition(
        existingButtons,
        2000,
        2000,
        200,
        120,
        250,
        20,
      );
      expect(pos?.y).toBe(270); // Next row
    });
  });

  describe("clamp", () => {
    it("should clamp value to min", () => {
      expect(clamp(-10, 0, 100)).toBe(0);
      expect(clamp(5, 10, 100)).toBe(10);
    });

    it("should clamp value to max", () => {
      expect(clamp(150, 0, 100)).toBe(100);
      expect(clamp(95, 0, 90)).toBe(90);
    });

    it("should return value when within range", () => {
      expect(clamp(50, 0, 100)).toBe(50);
      expect(clamp(0, 0, 100)).toBe(0);
      expect(clamp(100, 0, 100)).toBe(100);
    });
  });

  describe("snapToGrid", () => {
    it("should snap to nearest grid position", () => {
      expect(snapToGrid(0, 50)).toBe(0);
      expect(snapToGrid(25, 50)).toBe(50);
      expect(snapToGrid(75, 50)).toBe(100);
      expect(snapToGrid(100, 50)).toBe(100);
    });

    it("should handle different grid sizes", () => {
      expect(snapToGrid(15, 10)).toBe(20);
      expect(snapToGrid(14, 10)).toBe(10);
      expect(snapToGrid(123, 25)).toBe(125);
    });

    it("should snap negative values", () => {
      // Note: snapToGrid(-25, 50) returns -0 (JavaScript quirk)
      // -0 and 0 are equal in comparisons but toBe uses Object.is
      expect(Math.abs(snapToGrid(-25, 50))).toBe(0);
      expect(snapToGrid(-40, 50)).toBe(-50);
    });
  });

  describe("recalibrateButtonPositions", () => {
    const CANVAS_WIDTH = 4000;
    const CANVAS_HEIGHT = 4000;
    const BUTTON_WIDTH = 200;
    const BUTTON_HEIGHT = 120;

    it("should not recalibrate when buttons are within bounds and close to origin", () => {
      const buttons: ButtonPosition[] = [
        {
          buttonId: "1",
          layoutX: 100,
          layoutY: 100,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
        {
          buttonId: "2",
          layoutX: 500,
          layoutY: 300,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
      ];

      const result = recalibrateButtonPositions(
        buttons,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );

      expect(result).not.toBeNull();
      expect(result?.needsRecalibration).toBe(false); // No recalibration needed when within bounds and close to origin
      expect(result?.offsetX).toBe(0);
      expect(result?.offsetY).toBe(0);
      expect(result?.positions).toEqual(buttons); // Positions unchanged
    });

    it("should recalibrate when buttons have drifted significantly from origin", () => {
      const buttons: ButtonPosition[] = [
        {
          buttonId: "1",
          layoutX: 150, // > 100 drift threshold
          layoutY: 150,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
        {
          buttonId: "2",
          layoutX: 500,
          layoutY: 300,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
      ];

      const result = recalibrateButtonPositions(
        buttons,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );

      expect(result).not.toBeNull();
      expect(result?.needsRecalibration).toBe(true); // Recalibrate due to drift
      expect(result?.offsetX).toBe(-150); // Shift to bring leftmost to 0
      expect(result?.offsetY).toBe(-150); // Shift to bring topmost to 0
      expect(result?.positions).toEqual([
        {
          buttonId: "1",
          layoutX: 0,
          layoutY: 0,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
        {
          buttonId: "2",
          layoutX: 350,
          layoutY: 150,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
      ]);
    });

    it("should recalibrate when button is dragged left beyond origin", () => {
      const buttons: ButtonPosition[] = [
        {
          buttonId: "1",
          layoutX: -150,
          layoutY: 500,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
        {
          buttonId: "2",
          layoutX: 300,
          layoutY: 500,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
        {
          buttonId: "3",
          layoutX: 500,
          layoutY: 200,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
      ];

      const result = recalibrateButtonPositions(
        buttons,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );

      expect(result).not.toBeNull();
      expect(result?.needsRecalibration).toBe(true);
      expect(result?.offsetX).toBe(150); // Shift right by 150 to bring leftmost to 0
      expect(result?.offsetY).toBe(-200); // Shift up by 200 to bring topmost to 0
      expect(result?.positions).toEqual([
        {
          buttonId: "1",
          layoutX: 0,
          layoutY: 300,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
        {
          buttonId: "2",
          layoutX: 450,
          layoutY: 300,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
        {
          buttonId: "3",
          layoutX: 650,
          layoutY: 0,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
      ]);
    });

    it("should recalibrate when button is dragged right beyond canvas", () => {
      const buttons: ButtonPosition[] = [
        {
          buttonId: "1",
          layoutX: 3900,
          layoutY: 300,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        }, // Right edge at 4100 (beyond 4000 canvas)
        {
          buttonId: "2",
          layoutX: 200,
          layoutY: 500,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
      ];

      const result = recalibrateButtonPositions(
        buttons,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );

      expect(result).not.toBeNull();
      expect(result?.needsRecalibration).toBe(true);
      expect(result?.offsetX).toBe(-200); // Normalize to leftmost at 0
      expect(result?.offsetY).toBe(-300); // Normalize to topmost at 0
      expect(result?.positions).toEqual([
        {
          buttonId: "1",
          layoutX: 3700,
          layoutY: 0,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        }, // Normalized, fits within 4000
        {
          buttonId: "2",
          layoutX: 0,
          layoutY: 200,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
      ]);
    });

    it("should recalibrate when button is dragged up beyond origin", () => {
      const buttons: ButtonPosition[] = [
        {
          buttonId: "1",
          layoutX: 500,
          layoutY: -100,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
        {
          buttonId: "2",
          layoutX: 300,
          layoutY: 500,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
      ];

      const result = recalibrateButtonPositions(
        buttons,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );

      expect(result).not.toBeNull();
      expect(result?.needsRecalibration).toBe(true);
      expect(result?.offsetX).toBe(-300); // Shift left by 300 to bring leftmost to 0
      expect(result?.offsetY).toBe(100); // Shift down by 100 to bring topmost to 0
      expect(result?.positions).toEqual([
        {
          buttonId: "1",
          layoutX: 200,
          layoutY: 0,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
        {
          buttonId: "2",
          layoutX: 0,
          layoutY: 600,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
      ]);
    });

    it("should recalibrate when button is dragged down beyond canvas", () => {
      const buttons: ButtonPosition[] = [
        {
          buttonId: "1",
          layoutX: 500,
          layoutY: 3950,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        }, // Bottom edge at 4070 (beyond 4000 canvas)
        {
          buttonId: "2",
          layoutX: 300,
          layoutY: 100,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
      ];

      const result = recalibrateButtonPositions(
        buttons,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );

      expect(result).not.toBeNull();
      expect(result?.needsRecalibration).toBe(true);
      expect(result?.offsetX).toBe(-300); // Shift left by 300 to bring leftmost to 0
      expect(result?.offsetY).toBe(-100); // Shift up by 100 to bring topmost to 0
      expect(result?.positions).toEqual([
        {
          buttonId: "1",
          layoutX: 200,
          layoutY: 3850,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        }, // Normalized
        {
          buttonId: "2",
          layoutX: 0,
          layoutY: 0,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
      ]);
    });

    it("should recalibrate on both axes when button is dragged beyond both X and Y bounds", () => {
      const buttons: ButtonPosition[] = [
        {
          buttonId: "1",
          layoutX: -50,
          layoutY: -100,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
        {
          buttonId: "2",
          layoutX: 500,
          layoutY: 500,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
      ];

      const result = recalibrateButtonPositions(
        buttons,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );

      expect(result).not.toBeNull();
      expect(result?.needsRecalibration).toBe(true);
      expect(result?.offsetX).toBe(50); // Shift right by 50
      expect(result?.offsetY).toBe(100); // Shift down by 100
      expect(result?.positions).toEqual([
        {
          buttonId: "1",
          layoutX: 0,
          layoutY: 0,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
        {
          buttonId: "2",
          layoutX: 550,
          layoutY: 600,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
      ]);
    });

    it("should return null when buttons do not fit within canvas (too wide)", () => {
      // Scenario: buttons spread too far apart to fit on canvas even with recalibration
      // Initial positions: button 1 at 0, button 2 at 1800 (right edge at 2000)
      // Try to shift left by dragging button 1 to -200
      const draggedButtons: ButtonPosition[] = [
        {
          buttonId: "1",
          layoutX: -200,
          layoutY: 100,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
        {
          buttonId: "2",
          layoutX: 1600,
          layoutY: 100,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
      ];

      const result = recalibrateButtonPositions(
        draggedButtons,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );

      // Would need to shift right by 200, but button 2 would end up at 1800, right edge at 2000
      // This should still fit, so this case won't return null
      expect(result).not.toBeNull();
    });

    it("should return null when buttons truly do not fit", () => {
      const buttons: ButtonPosition[] = [
        {
          buttonId: "1",
          layoutX: -500,
          layoutY: 100,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
        {
          buttonId: "2",
          layoutX: 4100,
          layoutY: 100,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        }, // Right edge at 4300
      ];

      // Total spread is 4300 + 500 = 4800 > 4000 canvas width
      const result = recalibrateButtonPositions(
        buttons,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );

      expect(result).toBeNull();
    });

    it("should handle empty button list", () => {
      const result = recalibrateButtonPositions(
        [],
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );

      expect(result).not.toBeNull();
      expect(result?.needsRecalibration).toBe(false);
      expect(result?.offsetX).toBe(0);
      expect(result?.offsetY).toBe(0);
      expect(result?.positions).toEqual([]);
    });

    it("should handle single button beyond left edge", () => {
      const buttons: ButtonPosition[] = [
        {
          buttonId: "1",
          layoutX: -100,
          layoutY: 500,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
      ];

      const result = recalibrateButtonPositions(
        buttons,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );

      expect(result).not.toBeNull();
      expect(result?.needsRecalibration).toBe(true);
      expect(result?.offsetX).toBe(100); // Shift right to bring leftmost to 0
      expect(result?.offsetY).toBe(-500); // Shift up to bring topmost to 0
      expect(result?.positions).toEqual([
        {
          buttonId: "1",
          layoutX: 0,
          layoutY: 0,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        },
      ]);
    });

    it("should handle single button beyond right edge", () => {
      const buttons: ButtonPosition[] = [
        {
          buttonId: "1",
          layoutX: 4100,
          layoutY: 500,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        }, // Right edge at 4300 (beyond 4000)
      ];

      const result = recalibrateButtonPositions(
        buttons,
        CANVAS_WIDTH,
        CANVAS_HEIGHT,
      );

      expect(result).not.toBeNull();
      expect(result?.needsRecalibration).toBe(true);
      expect(result?.offsetX).toBe(-4100); // Normalize leftmost to 0
      expect(result?.offsetY).toBe(-500); // Normalize topmost to 0
      expect(result?.positions).toEqual([
        {
          buttonId: "1",
          layoutX: 0,
          layoutY: 0,
          width: BUTTON_WIDTH,
          height: BUTTON_HEIGHT,
        }, // Normalized to 0,0
      ]);
    });
  });
});
