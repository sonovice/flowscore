import {Accessor, Component, createContext, createEffect, createSignal, Setter, useContext} from 'solid-js';
import Cookies from 'js-cookie';

/**
 * Interface for user settings.
 */
export interface UserSettings {
  selectedStaves: [Accessor<number[]>, Setter<number[]>];
  scoreScale: [Accessor<number>, Setter<number>];
  colorizeBottomSystem: [Accessor<boolean>, Setter<boolean>];
  smartScroll: [Accessor<boolean>, Setter<boolean>];
  scrollPercentage: [Accessor<number>, Setter<number>];
  showSeparator: [Accessor<boolean>, Setter<boolean>];
  smoothScrolling: [Accessor<boolean>, Setter<boolean>];
}

// Create a context for user settings
const SettingsContext = createContext<UserSettings>();

/**
 * Component to provide user settings.
 *
 * @param {Object} props - The component props.
 * @param {any} props.children - The children of the component.
 */
export const SettingsProvider: Component<{ children: any }> = (props) => {
  // Get the staves from the URL or cookies
  const searchParams = new URLSearchParams(window.location.search);
  const stavesString = searchParams.get('staves');
  const stavesFromUrl = stavesString ? stavesString.split(',').map(Number) : [];

  // Create signals for the user settings
  const [selectedStaves, setSelectedStaves] = createSignal<number[]>(stavesFromUrl || JSON.parse(Cookies.get('selectedStaves') || "[]"));
  const [scoreScale, setScoreScale] = createSignal<number>(parseInt(Cookies.get('scoreScale') || "40"));
  const [colorizeBottomSystem, setColorizeBottomSystem] = createSignal<boolean>(Cookies.get('colorizeBottomSystem') === 'true');
  const [smartScroll, setSmartScroll] = createSignal<boolean>(Cookies.get('smartScroll') === 'true');
  const [scrollPercentage, setScrollPercentage] = createSignal<number>(parseInt(Cookies.get('scrollPercentage') || "75"));
  const [showSeparator, setShowSeparator] = createSignal<boolean>(Cookies.get('showSeparator') === 'true');
  const [smoothScrolling, setSmoothScrolling] = createSignal<boolean>(Cookies.get('smoothScrolling') === 'true');

  // Create effects to update the cookies and URL when the settings change
  createEffect(() => {
    Cookies.set('selectedStaves', JSON.stringify(selectedStaves()));
    const url = new URL(window.location.href);
    url.searchParams.set('staves', selectedStaves().join(','));
    window.history.pushState({}, '', url);
  });
  createEffect(() => Cookies.set('scoreScale', scoreScale().toString()));
  createEffect(() => Cookies.set('colorizeBottomSystem', colorizeBottomSystem().toString()));
  createEffect(() => Cookies.set('smartScroll', smartScroll().toString()));
  createEffect(() => Cookies.set('scrollPercentage', scrollPercentage().toString()));
  createEffect(() => Cookies.set('showSeparator', showSeparator().toString()));
  createEffect(() => Cookies.set('smoothScrolling', smoothScrolling().toString()));

  // Return the provider component
  return (
    <SettingsContext.Provider value={{
      selectedStaves: [selectedStaves, setSelectedStaves],
      scoreScale: [scoreScale, setScoreScale],
      colorizeBottomSystem: [colorizeBottomSystem, setColorizeBottomSystem],
      smartScroll: [smartScroll, setSmartScroll],
      scrollPercentage: [scrollPercentage, setScrollPercentage],
      showSeparator: [showSeparator, setShowSeparator],
      smoothScrolling: [smoothScrolling, setSmoothScrolling]
    }}>
      {props.children}
    </SettingsContext.Provider>
  );
};

/**
 * Hook to use the user settings.
 *
 * @returns {UserSettings} The user settings.
 */
export const useSettings = (): UserSettings => {
  return useContext(SettingsContext)!;
};