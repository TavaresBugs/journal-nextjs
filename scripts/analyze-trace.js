/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");

const TRACE_FILE = "Trace-20251229T110124.json"; // Using the one found
const filePath = path.join(process.cwd(), TRACE_FILE);

console.log(`Analyzing ${filePath}...`);

try {
  const rawData = fs.readFileSync(filePath, "utf-8");
  const traceData = JSON.parse(rawData);
  const events = traceData.traceEvents || traceData;

  const longTasks = [];
  const mainThreadByCat = {};
  const networkEvents = [];

  // Helper to get duration
  const getDuration = (event) => {
    if (event.dur) return event.dur / 1000; // microseconds to ms
    return 0;
  };

  events.forEach((event) => {
    // 1. Long Tasks (Top Level)
    if (
      event.name === "RunTask" ||
      event.name === "RunMicrotasks" ||
      event.name === "EvaluateScript"
    ) {
      const dur = getDuration(event);
      if (dur > 50) {
        longTasks.push({
          name: event.name,
          dur: dur,
          ts: event.ts,
          args: event.args,
        });
      }
    }

    // 2. Main Thread Breakdown
    if (event.cat && getDuration(event) > 0) {
      const cat = event.cat;
      if (!mainThreadByCat[cat]) mainThreadByCat[cat] = 0;
      mainThreadByCat[cat] += getDuration(event);
    }

    // 3. Network
    if (event.name === "ResourceSendRequest" || event.name === "ResourceFinish") {
      networkEvents.push(event);
    }
  });

  // Sort Long Tasks
  longTasks.sort((a, b) => b.dur - a.dur);

  console.log("\n--- TOP 10 LONG TASKS (>50ms) ---");
  longTasks.slice(0, 10).forEach((task, i) => {
    console.log(`${i + 1}. ${task.name}: ${task.dur.toFixed(2)}ms`);
    if (task.args && task.args.data && task.args.data.url) {
      console.log(`   URL: ${task.args.data.url}`);
    }
  });

  console.log("\n--- MAIN THREAD BREAKDOWN (ms) ---");
  Object.entries(mainThreadByCat)
    .sort(([, a], [, b]) => b - a)
    .forEach(([cat, time]) => {
      console.log(`${cat}: ${time.toFixed(2)}ms`);
    });

  console.log("\n--- JS EVALUATION SUMMARY ---");
  // Specifically look for v8.compile or EvaluateScript
  const scripts = events
    .filter((e) => e.name === "EvaluateScript" && getDuration(e) > 10)
    .sort((a, b) => getDuration(b) - getDuration(a));

  scripts.slice(0, 10).forEach((s, i) => {
    console.log(`${i + 1}. ${s.args?.data?.url || "unknown"}: ${(s.dur / 1000).toFixed(2)}ms`);
  });
} catch (error) {
  console.error("Error parsing trace:", error);
}
