// React DevTools configuration helper for Electron
// This script helps ensure React DevTools can properly detect React components

if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
  // Ensure React DevTools global hook is properly initialized
  if (!window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      isDisabled: false,
      supportsFiber: true,
      renderers: new Map(),
      supportsFabric: false,
      inject: function(renderer) {
        this.renderers.set(this.renderers.size + 1, renderer);
      },
      onCommitFiberRoot: function() {},
      onCommitFiberUnmount: function() {},
    };
  }
  
  // Force React DevTools to be enabled
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.isDisabled = false;
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__.supportsFiber = true;
  
  // Console log to verify initialization
  console.log('React DevTools configuration loaded successfully');
  
  // Wait for React to be available and register it
  const checkForReact = () => {
    if (window.React) {
      console.log('React detected, DevTools should be available');
      return;
    }
    // Check again in 100ms if React is not yet available
    setTimeout(checkForReact, 100);
  };
  
  // Start checking for React after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkForReact);
  } else {
    checkForReact();
  }
} 