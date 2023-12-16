import {render} from "solid-js/web";
import {SettingsProvider} from "./contexts/SettingsContext.tsx";
import "./index.css";
import App from "./App.tsx";

/* Fixes screen height computation, see https://css-tricks.com/the-trick-to-viewport-units-on-mobile/ */
document.documentElement.style.setProperty("--vh", window.innerHeight * 0.01 + 'px');

// Prevent zoom gestures
window.addEventListener('dblclick', function (event) {
  event.preventDefault();
}, {passive: false});

const root = document.getElementById("root")!;

render(() => (
  <SettingsProvider>
    <App/>
  </SettingsProvider>
), root);