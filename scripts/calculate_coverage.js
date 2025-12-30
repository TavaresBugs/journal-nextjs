/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
try {
  const coverage = JSON.parse(fs.readFileSync("coverage/coverage-final.json", "utf8"));
  let totalStatements = 0;
  let coveredStatements = 0;

  for (const file in coverage) {
    const fileCoverage = coverage[file];
    const statements = fileCoverage.s;
    for (const key in statements) {
      totalStatements++;
      if (statements[key] > 0) {
        coveredStatements++;
      }
    }
  }

  const percentage = totalStatements === 0 ? 0 : (coveredStatements / totalStatements) * 100;
  console.log(`Global Statement Coverage: ${percentage.toFixed(2)}%`);

  const dirs = {};
  for (const file in coverage) {
    const relative = file.replace(process.cwd() + "/", "");
    const dir = relative.substring(0, relative.lastIndexOf("/"));
    if (!dirs[dir]) dirs[dir] = { total: 0, covered: 0 };

    const statements = coverage[file].s;
    for (const key in statements) {
      dirs[dir].total++;
      if (statements[key] > 0) dirs[dir].covered++;
    }
  }

  console.log("\nDirectory Breakdown:");
  for (const dir in dirs) {
    const stats = dirs[dir];
    const pct = stats.total === 0 ? 0 : (stats.covered / stats.total) * 100;
    if (dir.includes("src/app/actions") || dir.includes("src/lib"))
      console.log(`${dir}: ${pct.toFixed(2)}% (${stats.covered}/${stats.total})`);
  }

  console.log("\nSpecific Files:");
  const filesToCheck = [
    "src/app/actions/accounts.ts",
    "src/app/actions/journal.ts",
    "src/app/actions/trades.ts",
    "src/app/actions/laboratory.ts",
    "src/app/actions/mental.ts",
    "src/app/actions/playbooks.ts",
    "src/app/actions/reviews.ts",
    "src/app/actions/share.ts",
    "src/app/actions/routines.ts",
  ];
  for (const f of filesToCheck) {
    const fullPath = Object.keys(coverage).find((k) => k.endsWith(f));
    if (fullPath) {
      const s = coverage[fullPath].s;
      let t = 0,
        c = 0;
      for (const k in s) {
        t++;
        if (s[k] > 0) c++;
      }
      console.log(`${f}: ${((c / t) * 100).toFixed(2)}% (${c}/${t})`);
    } else {
      console.log(`${f}: Not found in coverage`);
    }
  }
} catch (e) {
  console.error("Error reading coverage:", e.message);
}
