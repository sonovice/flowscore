import {onMount, Setter} from 'solid-js';
import {useSettings} from '../contexts/SettingsContext.tsx';

export function useInputHandler(
  containerRef: HTMLDivElement,
  highlightSystem: () => void,
  setIsScrolling: Setter<boolean>
) {
  const {
    smartScroll: [smartScroll],
    scrollPercentage: [scrollPercentage],
    colorizeBottomSystem: [colorizeBottomSystem],
    smoothScrolling: [smoothScrolling]
  } = useSettings();


  let lastScrollTop = 0;
  let scrollTimeout;

  containerRef.onscroll = handleScroll;
  containerRef.onclick = handleClick;

  function isInArea(x, y, area) {
    return x >= area.x && x <= area.x + area.width && y >= area.y && y <= area.y + area.height;
  }

  function handleClick(e: MouseEvent) {
    const {clientX, clientY} = e instanceof TouchEvent ? e.touches[0] : e;
    const {width, height} = containerRef.getBoundingClientRect();

    const areaRight = { x: width * 2 / 3, y: 0, width: width / 3, height };
    const areaLeft = { x: 0, y: 0, width: width / 3, height };
    const areaBottom = { x: 0, y: height * 2 / 3, width, height: height / 3 };
    const areaTop = { x: 0, y: 0, width, height: height / 3 };

    if (isInArea(clientX, clientY, areaRight) || isInArea(clientX, clientY, areaBottom)) {
      scrollForward();
    } else if (isInArea(clientX, clientY, areaLeft) || isInArea(clientX, clientY, areaTop)) {
      scrollBackward();
    }
  }

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
    setIsScrolling(false);
    if (colorizeBottomSystem()) {
      highlightSystem();
    }
  }

  function scrollBackward() {
    containerRef.scrollTo({
      top: containerRef.scrollTop - (containerRef.clientHeight * scrollPercentage() / 100),
      behavior: smoothScrolling() ? 'smooth' : 'instant'
    });
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
          containerRef.scrollTo({
            top: nextSystemTop,
            behavior: smoothScrolling() ? 'smooth' : 'instant'
          });
          break;
        }
      }
    } else {
      containerRef.scrollTo({
        top: containerRef.scrollTop + (screenHeight * scrollPercentage() / 100),
        behavior: smoothScrolling() ? 'smooth' : 'instant'
      });
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