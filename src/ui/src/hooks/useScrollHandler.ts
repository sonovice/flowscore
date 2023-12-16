import {onMount} from 'solid-js';
import {useSettings} from '../contexts/SettingsContext.tsx';

export function useScrollHandler(containerRef) {
  const [settings] = useSettings();

  const handleKeydown = (e) => {
    const systems: Element[] = containerRef.getElementsByClassName("viewer-system");
    const boundingRects = Array.from(systems).map((system) => system.getBoundingClientRect());
    const screenHeight = containerRef.clientHeight;

    switch (e.key) {
      // Scroll forward
      case 'PageUp':
      case 'ArrowLeft':
      case 'ArrowUp':
      case ' ':
        e.preventDefault();
        containerRef.scrollTo({top: containerRef.scrollTop - (screenHeight * settings()!.scrollPercentage / 100), behavior: 'smooth'});
        break;

      // Scroll backward
      case 'PageDown':
      case 'ArrowRight':
      case 'ArrowDown':
      case 'Enter':
        e.preventDefault();
        if (settings()!.smartScroll) {
          for (let i = 0; i < boundingRects.length; i++) {
            if (boundingRects[i].bottom > screenHeight) {
              const targetSystem = systems[i] as HTMLDivElement;
              // targetSystem.style.backgroundColor = '#FFEEEE';
              // setTimeout(() => {
              //   targetSystem.style.backgroundColor = '';
              // }, 1500)
              const nextSystemTop = targetSystem.getBoundingClientRect().top + containerRef.scrollTop + 1; // +1 to make sure that screen filling pages will not break next key press
              containerRef.scrollTo({top: nextSystemTop, behavior: 'smooth'});
              break;
            }
          }
        } else {
          containerRef.scrollTo({top: containerRef.scrollTop + (screenHeight * settings()!.scrollPercentage / 100), behavior: 'smooth'});
        }
        break;
    }
  };

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });
}