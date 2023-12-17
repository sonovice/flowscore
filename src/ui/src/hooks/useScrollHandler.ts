import {onMount} from 'solid-js';
import {useSettings} from '../contexts/SettingsContext.tsx';

export function useScrollHandler(containerRef, highlightSystem, setIsScrolling) {
  const {
    smartScroll: [smartScroll],
    scrollPercentage: [scrollPercentage],
    colorizeBottomSystem: [colorizeBottomSystem]
  } = useSettings();


  let lastScrollTop = 0;
  let scrollTimeout;

  containerRef.onscroll = handleScroll;

  function handleScroll() {
    setIsScrolling(true);
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }

    scrollTimeout = setTimeout(() => {
      // Check if the scroll position has changed
      if (containerRef.scrollTop !== lastScrollTop) {
        lastScrollTop = containerRef.scrollTop;
        handleScrollEnd();
      }
    }, 50);
  }

  function handleScrollEnd() {
    if (colorizeBottomSystem()) {
      highlightSystem();
    }
    setIsScrolling(false);
  }

  function scrollBackward() {
    containerRef.scrollTo({top: containerRef.scrollTop - (containerRef.clientHeight * scrollPercentage() / 100), behavior: 'smooth'});
  }

  function scrollForward() {
    const systems: HTMLCollectionOf<Element> = containerRef.getElementsByClassName("viewer-system");
    const boundingRects = Array.from(systems).map((system) => system.getBoundingClientRect());
    const screenHeight = containerRef.clientHeight;

    if (smartScroll()) {
      for (let i = 0; i < boundingRects.length; i++) {
        if (boundingRects[i].bottom > screenHeight) {
          const targetSystem = systems[i] as HTMLDivElement;
          const nextSystemTop = targetSystem.getBoundingClientRect().top + containerRef.scrollTop + 1; // +1 to make sure that screen filling pages will not break next key press
          containerRef.scrollTo({top: nextSystemTop, behavior: 'smooth'});
          break;
        }
      }
    } else {
      containerRef.scrollTo({top: containerRef.scrollTop + (screenHeight * scrollPercentage() / 100), behavior: 'smooth'});
    }
  }

  const handleKeydown = (e) => {
    switch (e.key) {
      // Scroll backward
      case 'PageUp':
      case 'ArrowLeft':
      case 'ArrowUp':
      case ' ':
        e.preventDefault();
        scrollBackward();
        break;

      // Scroll forward
      case 'PageDown':
      case 'ArrowRight':
      case 'ArrowDown':
      case 'Enter':
        e.preventDefault();
        scrollForward();
        break;
    }
  };

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });
}