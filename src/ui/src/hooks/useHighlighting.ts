import {Accessor, createEffect} from 'solid-js';

/**
 * Hook to handle highlighting of systems in a container.
 *
 * @param {HTMLDivElement} containerRef - The container in which the systems are displayed.
 * @param {Accessor<string[]>} svgStrings - An accessor function for SVG strings.
 * @param {Accessor<boolean>} colorizeBottomSystem - An accessor function to determine if the bottom system should be colorized.
 * @param {Accessor<boolean>} isScrolling - An accessor function to determine if the user is scrolling.
 *
 * @returns {Object} An object containing the highlightSystem function.
 */
export function useHighlighting(
  containerRef: HTMLDivElement,
  svgStrings: Accessor<string[]>,
  colorizeBottomSystem: Accessor<boolean>,
  isScrolling: Accessor<boolean>
): {highlightSystem: () => void} {
  let highlightedSystem: HTMLDivElement;

  /**
   * Function to highlight a system in the container.
   * It iterates over all systems in the container and highlights the one that is at the bottom of the screen.
   * If a system was previously highlighted and the user is not scrolling, it resets the background color of the previously highlighted system after a delay.
   */
  function highlightSystem() {
    // Get all systems in the container
    const systems: HTMLCollectionOf<Element> = containerRef.getElementsByClassName("viewer-system");

    // Get the bounding rectangle for each system
    const boundingRects = Array.from(systems).map(system => system.getBoundingClientRect());

    // Get the height of the container
    const screenHeight = containerRef.clientHeight;

    // Iterate over all bounding rectangles
    for (let i = 0; i < boundingRects.length; i++) {
      // If the bottom of the bounding rectangle is greater than or equal to the screen height
      if (boundingRects[i].bottom >= screenHeight) {
        // Get the target system
        const targetSystem = systems[i] as HTMLDivElement;

        // Set the background color of the target system
        targetSystem.style.backgroundColor = '#EFF6FF'; //'#DBEAFE';

        // If the user is not scrolling and there is a previously highlighted system and the target system is not the previously highlighted system
        if (!isScrolling() && highlightedSystem && targetSystem != highlightedSystem) {
          // Copy reference to the previously highlighted system
          const prevHighlightedSystem = highlightedSystem;

          // After a delay, reset the background color of the previously highlighted system
          setTimeout(() => {
            prevHighlightedSystem.style.backgroundColor = '#FFFFFF'
          }, 1000);
        }

        // Set the highlighted system to the target system
        highlightedSystem = targetSystem;

        // Break the loop
        break;
      }
    }
  }

  /**
   * Effect to trigger the highlightSystem function.
   * It is triggered whenever the SVG strings change, and if the bottom system should be colorized and the user is not scrolling.
   */
  createEffect(() => {
    svgStrings(); // Trigger
    if (colorizeBottomSystem() && !isScrolling()) {
      requestAnimationFrame(highlightSystem)
    }
  });

  return {
    highlightSystem
  };
}