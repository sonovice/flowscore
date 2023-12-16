import {Accessor, Component, createContext, createEffect, createSignal, onMount, Setter, useContext} from 'solid-js';
import Cookies from 'js-cookie';

export interface UserSettings {
  selectedStaves: number[];
  scoreScale: number;
  colorizeBottomSystem: boolean;
  smartScroll: boolean;
  scrollPercentage: number;
  showDivider: boolean;
}

// Default values
const defaultSettings: UserSettings = {
  selectedStaves: [],
  scoreScale: 40,
  colorizeBottomSystem: true,
  smartScroll: true,
  scrollPercentage: 75,
  showDivider: true,
};

const COOKIE_NAME = 'userSettings';

function loadSettingsFromCookies(): UserSettings {
  const cookieSettings = Cookies.get(COOKIE_NAME);
  return cookieSettings ? JSON.parse(cookieSettings) : defaultSettings;
}

function saveSettingsToCookies(settings: UserSettings) {
  Cookies.set(COOKIE_NAME, JSON.stringify(settings)); // Gültigkeit für 7 Tage
}

function updateUrlSearchParams(selectedStaves) {
  const url = new URL(window.location.href);
  url.searchParams.set('staves', selectedStaves.join(','));
  window.history.pushState({}, '', url);
}

export const SettingsContext = createContext<[Accessor<UserSettings>, Setter<UserSettings>]>();

export const SettingsProvider: Component<{ children: any }> = (props) => {
  const initialSettings = loadSettingsFromCookies();
  const [settings, setSettings] = createSignal<UserSettings>(initialSettings);

  function initializeSettings() {
    const searchParams = new URLSearchParams(window.location.search);
    const stavesFromUrl = searchParams.get('staves');

    if (stavesFromUrl) {
      const newSelectedStaves = stavesFromUrl.split(',').map(Number);
      setSettings({...initialSettings, selectedStaves: newSelectedStaves});
    }
  }

  // Ausführen der Initialisierung beim Mounten
  onMount(initializeSettings);

  createEffect(() => {
    const currentSettings = settings();
    saveSettingsToCookies(currentSettings);
    updateUrlSearchParams(currentSettings.selectedStaves);
  });

  return (
    <SettingsContext.Provider value={[settings, setSettings]}>
      {props.children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): [Accessor<UserSettings>, Setter<UserSettings>] => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
