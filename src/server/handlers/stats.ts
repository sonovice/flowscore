import {compareNumbers} from "../utils.ts";
import {subscribedStaves} from "../globals.ts";

export function handle_stats() {
  let response = '';
  const totalCount = Object.values(subscribedStaves).reduce((a, b) => a + b, 0);
  response += `Connected clients (${totalCount})\n`;
  response += "=================\n";
  const sortedStaffNums = Object.keys(subscribedStaves).sort(compareNumbers);
  sortedStaffNums.forEach(staffNum => {
    const count = subscribedStaves[staffNum];
    const bar = '█'.repeat(count);
    response += `Staff ${staffNum}:\t${bar} (${count})\n`;
  });
  return response;
}