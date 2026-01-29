export const prefersReducedMotion = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

/**
 * Starts a view transition with progressive enhancement.
 * Per improve-1.md: For React state updates, wrap them in flushSync inside the action callback.
 * @param action - Callback that performs DOM/state updates. For sync updates, use flushSync internally.
 * @returns ViewTransition object or undefined if not supported/reduced motion
 */
export const startViewTransition = (action: () => void) => {
  if (typeof document === "undefined") {
    action();
    return undefined;
  }

  const reduceMotion = prefersReducedMotion();
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => { finished?: Promise<void> } | void;
  };

  if (!reduceMotion && doc.startViewTransition) {
    // Note: Callers should wrap React state updates in flushSync inside action()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - host env may augment document
    return doc.startViewTransition(action) as any;
  } else {
    action();
    return undefined;
  }
};
