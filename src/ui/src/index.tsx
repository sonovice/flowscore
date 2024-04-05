import {render} from "solid-js/web";
import {SettingsProvider} from "./contexts/SettingsContext.tsx";
import "./index.css";
import App from "./App.tsx";

/**
 * Fixes screen height computation.
 * For more details, see https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
 */
document.documentElement.style.setProperty("--vh", window.innerHeight * 0.01 + 'px');

/**
 * Prevent zoom gestures by disabling double click events.
 */
window.addEventListener('dblclick', function (event) {
  event.preventDefault();
}, {passive: false});

// Get the root element for rendering the application
const root = document.getElementById("root")!;

/**
 * Render the main application.
 * The application is wrapped with the SettingsProvider to provide global access to settings.
 */
render(() => (
  <SettingsProvider>
    <App/>
  </SettingsProvider>
), root);