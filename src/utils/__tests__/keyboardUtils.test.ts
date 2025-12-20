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

    it("should return true when event target is a child of contentEditable element", () => {
      const div = document.createElement("div");
      div.contentEditable = "true";
      const span = document.createElement("span");
      div.appendChild(span);
      document.body.appendChild(div);

      const event = new KeyboardEvent("keydown", { key: " " });
      Object.defineProperty(event, "target", {
        value: span,
        writable: false,
      });

      expect(shouldIgnoreKeyboardEvent(event)).toBe(true);

      document.body.removeChild(div);
    });

    it("should return true when event target is a deeply nested element in contentEditable", () => {
      const div = document.createElement("div");
      div.contentEditable = "true";
      const paragraph = document.createElement("p");
      const span = document.createElement("span");
      const textNode = document.createElement("b");

      div.appendChild(paragraph);
      paragraph.appendChild(span);
      span.appendChild(textNode);
      document.body.appendChild(div);

      const event = new KeyboardEvent("keydown", { key: "ArrowLeft" });
      Object.defineProperty(event, "target", {
        value: textNode,
        writable: false,
      });

      expect(shouldIgnoreKeyboardEvent(event)).toBe(true);

      document.body.removeChild(div);
    });

    it("should return true when event target is nested within an INPUT container", () => {
      // This test ensures we handle the case where focus is on an input element
      // that might be wrapped in other containers
      const form = document.createElement("form");
      const input = document.createElement("input");
      form.appendChild(input);
      document.body.appendChild(form);

      const event = new KeyboardEvent("keydown", { key: " " });
      Object.defineProperty(event, "target", {
        value: input,
        writable: false,
      });

      expect(shouldIgnoreKeyboardEvent(event)).toBe(true);

      document.body.removeChild(form);
    });

    it("should return false when event.target is null", () => {
      const event = new KeyboardEvent("keydown", { key: " " });
      Object.defineProperty(event, "target", { value: null, writable: false });

      expect(shouldIgnoreKeyboardEvent(event)).toBe(false);
    });

    it("should return true when event target is a disabled INPUT element", () => {
      const input = document.createElement("input");
      input.disabled = true;
      const event = new KeyboardEvent("keydown", { key: " " });
      Object.defineProperty(event, "target", { value: input, writable: false });

      // Disabled inputs still block shortcuts - user might have focus there
      // and it would be confusing if shortcuts worked
      expect(shouldIgnoreKeyboardEvent(event)).toBe(true);
    });

    it("should return true when event target is a readonly INPUT element", () => {
      const input = document.createElement("input");
      input.readOnly = true;
      const event = new KeyboardEvent("keydown", { key: " " });
      Object.defineProperty(event, "target", { value: input, writable: false });

      // Readonly inputs still block shortcuts - user can still navigate text with arrows
      expect(shouldIgnoreKeyboardEvent(event)).toBe(true);
    });

    it("should handle non-standard DOM nodes with undefined tagName", () => {
      // Create a mock element that might not have a tagName (edge case)
      const mockElement = {
        tagName: undefined,
        contentEditable: "false",
        parentElement: null,
      } as unknown as HTMLElement;

      const event = new KeyboardEvent("keydown", { key: " " });
      Object.defineProperty(event, "target", {
        value: mockElement,
        writable: false,
      });

      // Should not throw and should return false
      expect(shouldIgnoreKeyboardEvent(event)).toBe(false);
    });
  });
});
