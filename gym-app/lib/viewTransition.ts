export const prefersReducedMotion = () => {
  if (typeof window === "undefined") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export const startViewTransition = (action: () => void) => {
  if (typeof document === "undefined") {
    action();
    return;
  }

  const reduceMotion = prefersReducedMotion();
  const doc = document as Document & {
    startViewTransition?: (callback: () => void) => void;
  };

  if (!reduceMotion && doc.startViewTransition) {
    doc.startViewTransition(action);
  } else {
    action();
  }
};
