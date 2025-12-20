import { shouldIgnoreKeyboardEvent } from "../keyboardUtils";

describe("keyboardUtils", () => {
  describe("shouldIgnoreKeyboardEvent", () => {
    it("should return true when event target is an INPUT element", () => {
      const input = document.createElement("input");
      const event = new KeyboardEvent("keydown", {
        key: " ",
      });
      Object.defineProperty(event, "target", { value: input, writable: false });

      expect(shouldIgnoreKeyboardEvent(event)).toBe(true);
    });

    it("should return true when event target is a TEXTAREA element", () => {
      const textarea = document.createElement("textarea");
      const event = new KeyboardEvent("keydown", {
        key: "ArrowRight",
      });
      Object.defineProperty(event, "target", {
        value: textarea,
        writable: false,
      });

      expect(shouldIgnoreKeyboardEvent(event)).toBe(true);
    });

    it("should return true when event target is a SELECT element", () => {
      const select = document.createElement("select");
      const event = new KeyboardEvent("keydown", {
        key: "ArrowDown",
      });
      Object.defineProperty(event, "target", {
        value: select,
        writable: false,
      });

      expect(shouldIgnoreKeyboardEvent(event)).toBe(true);
    });

    it("should return true when event target is contentEditable", () => {
      const div = document.createElement("div");
      div.contentEditable = "true";
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
      });
      Object.defineProperty(event, "target", { value: div, writable: false });

      expect(shouldIgnoreKeyboardEvent(event)).toBe(true);
    });

    it("should return false when event target is a regular DIV", () => {
      const div = document.createElement("div");
      const event = new KeyboardEvent("keydown", {
        key: " ",
      });
      Object.defineProperty(event, "target", { value: div, writable: false });

      expect(shouldIgnoreKeyboardEvent(event)).toBe(false);
    });

    it("should return false when event target is a BUTTON", () => {
      const button = document.createElement("button");
      const event = new KeyboardEvent("keydown", {
        key: "Enter",
      });
      Object.defineProperty(event, "target", {
        value: button,
        writable: false,
      });

      expect(shouldIgnoreKeyboardEvent(event)).toBe(false);
    });

    it("should return false when event target is document.body", () => {
      const event = new KeyboardEvent("keydown", {
        key: " ",
      });
      Object.defineProperty(event, "target", {
        value: document.body,
        writable: false,
      });

      expect(shouldIgnoreKeyboardEvent(event)).toBe(false);
    });
  });
});
