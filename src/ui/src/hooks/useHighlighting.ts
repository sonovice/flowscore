import { createEffect } from 'solid-js';

export function useHighlighting(containerRef, svgStrings, colorizeBottomSystem, isScrolling) {
  let highlightedSystem: HTMLDivElement;

  function highlightSystem() {
    const systems: HTMLCollectionOf<Element> = containerRef.getElementsByClassName("viewer-system");
    const boundingRects = Array.from(systems).map(system => system.getBoundingClientRect());
    const screenHeight = containerRef.clientHeight;

    for (let i = 0; i < boundingRects.length; i++) {
      if (boundingRects[i].bottom >= screenHeight) {
        const targetSystem = systems[i] as HTMLDivElement;
        targetSystem.style.backgroundColor = '#EFF6FF'; //'#DBEAFE';
        if (!isScrolling() && highlightedSystem && targetSystem != highlightedSystem) {
          const prevHighlightedSystem = highlightedSystem; // Copy reference
          setTimeout(() => {prevHighlightedSystem.style.backgroundColor = '#FFFFFF'}, 1000);
        }
        highlightedSystem = targetSystem;
        break;
      }
    }
  }

  createEffect(() => {
    svgStrings(); // Trigger
    if(colorizeBottomSystem() && !isScrolling()) {
      requestAnimationFrame(highlightSystem)
    }
  });

  return {
    highlightSystem
  };
}