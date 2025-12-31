/* eslint-disable */
const fs = require("fs");
const path = require("path");

const filename = process.argv[2];
if (!filename) {
  console.error("Please provide a file path.");
  process.exit(1);
}

try {
  const data = fs.readFileSync(filename, "utf8");
  const trace = JSON.parse(data);
  const events = trace.traceEvents || (Array.isArray(trace) ? trace : []);

  if (events.length === 0) {
    console.error("No events found in trace.");
    process.exit(1);
  }

  let minTs = Infinity;
  let maxTs = -Infinity;

  // 1. Identify Main Thread (heuristic: thread with most events or specific naming)
  // For simplicity, we'll scan all events first for timing and stats

  const threads = {};
  events.forEach((e) => {
    if (e.ts) {
      minTs = Math.min(minTs, e.ts);
      maxTs = Math.max(maxTs, e.ts);
    }
    if (e.dur) {
      const k = `${e.pid}:${e.tid}`;
      threads[k] = (threads[k] || 0) + e.dur;
    }
  });

  // Assume main thread is the one with the most duration activity
  const mainThreadKey = Object.keys(threads).sort((a, b) => threads[b] - threads[a])[0];
  const [mainPid, mainTid] = mainThreadKey.split(":").map(Number);

  console.log(`Analyzing: ${path.basename(filename)}`);
  console.log(`Trace Duration: ${((maxTs - minTs) / 1000).toFixed(2)} ms`);
  console.log(`Main Thread guessed: PID ${mainPid} TID ${mainTid}`);

  // Metrics
  let lcp = 0;
  let cls = 0;
  let longTasksCount = 0;
  let tbt = 0;
  let domContentLoaded = 0;
  let totalDuration = {
    Scripting: 0,
    Rendering: 0,
    Painting: 0,
    System: 0,
    Idle: 0,
  };

  // Helper map for categories
  const categoryMap = {
    RunTask: "System",
    FunctionCall: "Scripting",
    EvaluateScript: "Scripting",
    "v8.compile": "Scripting",
    MajorGC: "Scripting",
    MinorGC: "Scripting",
    Layout: "Rendering",
    UpdateLayerTree: "Rendering",
    HitTest: "Rendering",
    RecalculateStyles: "Rendering",
    ParseHTML: "Rendering",
    Paint: "Painting",
    CompositeLayers: "Painting",
    EventDispatch: "Scripting",
    TimerFire: "Scripting",
    XHRReadyStateChange: "Scripting",
  };

  events.forEach((e) => {
    // Core Web Vitals candidates
    if (e.name === "largestContentfulPaint::Candidate" && e.args && e.args.data) {
      // We want the latest candidate that is likely the final LCP.
      // The LCP time is usually relative to navigation start.
      const candidateTime = (e.ts - minTs) / 1000;
      if (candidateTime > lcp) lcp = candidateTime;
    }

    if (e.name === "LayoutShift" && e.args && e.args.data && !e.args.data.had_recent_input) {
      cls += e.args.data.score || 0;
    }

    // Navigation timings (approximate)
    if (e.name === "DomContentLoadedEventEnd") {
      domContentLoaded = (e.ts - minTs) / 1000;
    }

    // Main Thread work analysis
    if (e.pid === mainPid && e.tid === mainTid && e.dur) {
      const durationMs = e.dur / 1000;

      // TBT & Long Tasks
      if (durationMs > 50) {
        longTasksCount++;
        tbt += durationMs - 50;
      }

      // Categorization
      let cat = "System"; // default unknown
      if (categoryMap[e.name]) {
        cat = categoryMap[e.name];
      } else if (e.name === "RunMicrotasks") {
        cat = "Scripting";
      }
      // Simple heuristic mapping

      if (totalDuration[cat] !== undefined) {
        totalDuration[cat] += durationMs;
      }
    }
  });

  console.log("\n--- Web Vitals (Approx) ---");
  console.log(`LCP (Last Candidate): ${lcp.toFixed(2)} ms`);
  console.log(`CLS (Cumulative): ${cls.toFixed(4)}`);
  console.log(`TBT (Total Blocking Time): ${tbt.toFixed(2)} ms`);
  console.log(`Long Tasks Count: ${longTasksCount}`);

  console.log("\n--- Main Thread Breakdown (ms) ---");
  Object.keys(totalDuration).forEach((k) => {
    if (k !== "Idle" && totalDuration[k] > 0) {
      console.log(`${k}: ${totalDuration[k].toFixed(2)} ms`);
    }
  });

  console.log("-----------------------------------");
} catch (err) {
  console.error("Error analyzing trace:", err);
}
