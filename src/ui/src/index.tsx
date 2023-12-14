import { render } from "solid-js/web";
import { HashRouter, Route } from "@solidjs/router";
import "./index.css";

import Home from "./pages/Home";
import Score from "./pages/Score";

// Wake Lock
async function requestWakeLock() {
  if ("wakeLock" in navigator) {
    try {

      const wakeLock = await navigator.wakeLock.request("screen");
      console.log("Wake Lock is active");
      wakeLock.addEventListener("release", async () => {
        await requestWakeLock();
      })

    } catch (err: any) {
      // The Wake Lock request has failed - usually system related, such as battery.
      console.warn(`${err.name}, ${err.message}`);
    }
  }
  else {
    console.log("Wake Lock not supported on this device.")
  }
}
requestWakeLock();


const root = document.getElementById("root")!;

render(() => (
  <HashRouter>
    <Route path="/" component={Home} />
    <Route path="/score" component={Score} />
  </HashRouter>
), root);