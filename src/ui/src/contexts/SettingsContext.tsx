import {Accessor, Component, createContext, createEffect, createSignal, Setter, useContext} from 'solid-js';
import Cookies from 'js-cookie';

export interface UserSettings {
  selectedStaves: [Accessor<number[]>, Setter<number[]>];
  scoreScale: [Accessor<number>, Setter<number>];
  colorizeBottomSystem: [Accessor<boolean>, Setter<boolean>];
  smartScroll: [Accessor<boolean>, Setter<boolean>];
  scrollPercentage: [Accessor<number>, Setter<number>];
  showSeparator: [Accessor<boolean>, Setter<boolean>];
}

const SettingsContext = createContext<UserSettings>();

export const SettingsProvider: Component<{ children: any }> = (props) => {
  const searchParams = new URLSearchParams(window.location.search);
  const stavesString = searchParams.get('staves');
  const stavesFromUrl = stavesString ? stavesString.split(',').map(Number) : [];

  const [selectedStaves, setSelectedStaves] = createSignal<number[]>(
    stavesFromUrl || JSON.parse(Cookies.get('selectedStaves') || "[]")
  );
  const [scoreScale, setScoreScale] = createSignal<number>(parseInt(Cookies.get('scoreScale') || "40"));
  const [colorizeBottomSystem, setColorizeBottomSystem] = createSignal<boolean>(Cookies.get('colorizeBottomSystem') === 'true');
  const [smartScroll, setSmartScroll] = createSignal<boolean>(Cookies.get('smartScroll') === 'true');
  const [scrollPercentage, setScrollPercentage] = createSignal<number>(parseInt(Cookies.get('scrollPercentage') || "75"));
  const [showSeparator, setShowSeparator] = createSignal<boolean>(Cookies.get('showSeparator') === 'true');

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

  return (
    <SettingsContext.Provider value={{
      selectedStaves: [selectedStaves, setSelectedStaves],
      scoreScale: [scoreScale, setScoreScale],
      colorizeBottomSystem: [colorizeBottomSystem, setColorizeBottomSystem],
      smartScroll: [smartScroll, setSmartScroll],
      scrollPercentage: [scrollPercentage, setScrollPercentage],
      showSeparator: [showSeparator, setShowSeparator]
    }}>
      {props.children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): UserSettings => {
  return useContext(SettingsContext)!;
};
