import {compareNumbers} from "../../utils.ts";
import {subscribedStaves} from "../globals.ts";

export function handle_stats() {
  let response = '';
  const totalCount = Object.values(subscribedStaves).reduce((a, b) => a + b, 0);
  response += `Connected clients (${totalCount})\n\n`;
  const sortedStaffNums = Object.keys(subscribedStaves).sort(compareNumbers);
  // Get max width of staffNum string
  const maxStaffNumLength = sortedStaffNums.reduce((max, staffNum) => Math.max(max, staffNum.length), 0);

  sortedStaffNums.forEach(staffNum => {
    const count = subscribedStaves[staffNum];
    const bar = '█'.repeat(count);
    // Get the number of spaces needed to pad the staffNum string
    const padLength = maxStaffNumLength - staffNum.length;
    const padding = ' '.repeat(padLength);
    response += `Staff ${staffNum}: ${padding}${bar} (${count})\n`;
  });

  // Create an HTML response with a meta refresh tag
  const htmlResponse = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="refresh" content="1">
    </head>
    <body>
      <pre>${response}</pre>
    </body>
    </html>
  `;

  return new Response(htmlResponse, {headers: {'Content-Type': 'text/html'}});
}