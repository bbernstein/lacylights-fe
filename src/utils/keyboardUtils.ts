/**
 * Utility functions for keyboard event handling
 */

/**
 * Determines if a keyboard event should be ignored because the user is typing in an input field.
 * This prevents keyboard shortcuts from triggering when the user is editing text in modals or forms.
 *
 * The function checks the event target and walks up the DOM tree to handle cases where
 * the event originates from a nested element within a contentEditable container.
 *
 * @param event - The keyboard event to check
 * @returns true if the event should be ignored (user is typing), false if it should be processed
 */
export function shouldIgnoreKeyboardEvent(event: KeyboardEvent): boolean {
  // Defensive check: ensure event has a target
  if (!event.target) {
    return false;
  }

  const target = event.target as HTMLElement;

  // Walk up the DOM tree to check if the target or any parent is an editable element
  let element: HTMLElement | null = target;
  while (element) {
    // Get tagName in uppercase for case-insensitive comparison (defensive programming)
    // Fallback to empty string for non-standard DOM nodes that may lack tagName
    const tagName = element.tagName?.toUpperCase() || '';

    // Ignore events from input fields, textareas, select elements, and content-editable elements
    if (
      tagName === "INPUT" ||
      tagName === "TEXTAREA" ||
      tagName === "SELECT" ||
      element.contentEditable === "true"
    ) {
      return true;
    }
    element = element.parentElement;
  }

  return false;
}
