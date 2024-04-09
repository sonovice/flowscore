import getStaticFile from "../../ui/dist-static";
import {COLOR_GREEN, COLOR_GREEN_BOX, COLOR_RED, COLOR_RED_BOX, COLOR_RESET} from "../utils.ts";

export async function handle_static_files(params: { path: string }) {
  let path = params.path;

  // Remove leading slash
  if (path.startsWith('/')) {
    path = path.slice(1);
  }

  // Default to index.html if no path is provided
  if (path === '') {
    path = 'index.html'
  }

  // Serve the requested file
  const file = getStaticFile(path);
  if (await file.exists()) {
    // If the file exists, serve it with a 200 status (HTTP OK)
    console.log(`[${new Date().toISOString()}] ${COLOR_GREEN}GET "${path}" ${COLOR_GREEN_BOX}200${COLOR_RESET}`);
    return new Response(file, {headers: {'Content-Type': file.type}});
  } else {
    // If the file does not exist, return a 404 status (HTTP Not Found)
    console.log(`[${new Date().toISOString()}] ${COLOR_RED}GET "${path}" ${COLOR_RED_BOX}404${COLOR_RESET}`);
    return new Response("Not Found", {status: 404});
  }
}