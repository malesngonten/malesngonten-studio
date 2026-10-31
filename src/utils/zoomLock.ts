/**
 * Global page zoom prevention utility.
 * Prevents pinch-to-zoom, gesture zooming, double-tap zoom, and Ctrl/Cmd+wheel zoom across the entire page,
 * EXCEPT for elements marked with [data-allow-zoom="true"] (e.g. Remotion player).
 */

export function setupPageZoomLock(): () => void {
  // Prevent Safari / iOS gesture events
  const handleGesture = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (target && target.closest('[data-allow-zoom="true"]')) {
      return; // Allow gesture inside player
    }
    e.preventDefault();
  };

  // Prevent Ctrl/Cmd + wheel zoom on window
  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-allow-zoom="true"]')) {
        return; // Allow wheel zoom on player
      }
      e.preventDefault();
    }
  };

  // Prevent keyboard zoom shortcuts (Ctrl/Cmd + '+', '-', '0')
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === '+' || e.key === '-' || e.key === '=' || e.key === '0' || e.key === '_') {
        const target = e.target as HTMLElement | null;
        if (target && target.closest('[data-allow-zoom="true"]')) {
          return; // Allow zoom inside player
        }
        e.preventDefault();
      }
    }
  };

  // Prevent double-tap zoom on mobile
  let lastTouchEndTime = 0;
  const handleTouchEnd = (e: TouchEvent) => {
    const now = Date.now();
    const target = e.target as HTMLElement | null;
    if (target && target.closest('[data-allow-zoom="true"]')) {
      return; // Allow interactions inside player
    }
    if (now - lastTouchEndTime <= 300) {
      e.preventDefault();
    }
    lastTouchEndTime = now;
  };

  // Attach global listeners with non-passive flags where required
  document.addEventListener('gesturestart', handleGesture, { passive: false });
  document.addEventListener('gesturechange', handleGesture, { passive: false });
  document.addEventListener('gestureend', handleGesture, { passive: false });
  window.addEventListener('wheel', handleWheel, { passive: false });
  window.addEventListener('keydown', handleKeyDown);
  document.addEventListener('touchend', handleTouchEnd, { passive: false });

  return () => {
    document.removeEventListener('gesturestart', handleGesture);
    document.removeEventListener('gesturechange', handleGesture);
    document.removeEventListener('gestureend', handleGesture);
    window.removeEventListener('wheel', handleWheel);
    window.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('touchend', handleTouchEnd);
  };
}
