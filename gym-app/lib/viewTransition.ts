export const prefersReducedMotion = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

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
    // startViewTransition may return a transition-like object in some browsers
    // Return it so callers can hook into finished if desired.
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - host env may augment document
    return doc.startViewTransition(action) as any;
  } else {
    action();
    return undefined;
  }
};
