# FlowScore User Guide (for Musicians)

Welcome to FlowScore! This guide explains how to use FlowScore to view specific parts (staves) of a musical score being streamed live.

## What is FlowScore?

FlowScore is a web application that lets you see musical notation in real-time. Imagine a conductor or another system sending out the entire orchestra score (as MEI data). FlowScore server receives this data, and you, as a musician, can connect using your web browser to see *only* the specific instrument part(s) you need (e.g., just the Trumpet part, or Violin I and II).

The notation updates automatically as new data is sent by the source.

## How to Connect

1.  **Get the Server Address:** The person running the FlowScore server (the Operator) will provide you with a URL. It will look something like `http://[server-ip-address]:[port]/` (e.g., `http://192.168.1.100:8765/`).
2.  **Open in Browser:** Open this URL in your web browser (like Chrome, Firefox, Safari, Edge).

## Viewing Specific Staves

By default, when you connect to the main address, you might see all the staves from the score.

To view only specific staves, you need to add a `staves` parameter to the URL. This is done by adding `?staves=` followed by the stave numbers you want to see, separated by commas.

*   **Stave Numbers:** Stave numbers usually start from 1. You'll need to know which number corresponds to which instrument/part in the specific MEI file being used. The operator or provider of the MEI data should be able to tell you this.
*   **Example URLs:**
    *   To view only stave 1: `http://[server-ip-address]:[port]/?staves=1`
    *   To view staves 3 and 5: `http://[server-ip-address]:[port]/?staves=3,5`
    *   To view staves 2, 4, and 6: `http://[server-ip-address]:[port]/?staves=2,4,6`

**Note:** The user interface *might* also provide a way to select staves directly without changing the URL. Explore the page when you connect to see if such options are available.

## What to Expect

Once connected (with or without specific staves selected), you should see the musical notation for your chosen part(s). As the provider sends updates, the score displayed in your browser will refresh automatically to show the latest music.

*   **Settings:** Look for a settings button (often a gear icon) on the page. This may allow you to adjust viewing options or clear the currently displayed score.
*   **Connection Status:** There might be a visual indicator (e.g., a button that changes color) showing whether your browser is successfully connected to the FlowScore server.

If you encounter issues (e.g., the score doesn't load or update), please contact the person who is operating the FlowScore server. 