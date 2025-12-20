/**
 * Utility functions for keyboard event handling
 */

/**
 * Determines if a keyboard event should be ignored because the user is typing in an input field.
 * This prevents keyboard shortcuts from triggering when the user is editing text in modals or forms.
 *
 * @param event - The keyboard event to check
 * @returns true if the event should be ignored (user is typing), false if it should be processed
 */
export function shouldIgnoreKeyboardEvent(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;

  // Ignore events from input fields, textareas, and content-editable elements
  if (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.contentEditable === "true"
  ) {
    return true;
  }

  // Ignore events when a select element has focus
  if (target.tagName === "SELECT") {
    return true;
  }

  return false;
}
