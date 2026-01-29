/**
 * Creates a debounced scheduler that delays action execution until after
 * a specified delay has elapsed since the last schedule call.
 *
 * @param delayMs - The delay in milliseconds
 * @returns Object with schedule and cancel methods
 *
 * @example
 * const { schedule, cancel } = createDebounced(500);
 * schedule(() => console.log('Executed after 500ms of inactivity'));
 * cancel(); // Cancels the pending execution
 */
export function createDebounced(delayMs: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const schedule = (action: () => void) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = null;
      action();
    }, delayMs);
  };

  const cancel = () => {
    if (!timeout) return;
    clearTimeout(timeout);
    timeout = null;
  };

  return { schedule, cancel };
}
