/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const fs = require("fs");

try {
  const data = JSON.parse(fs.readFileSync("./coverage/coverage-final.json", "utf8"));

  let totalStatements = 0;
  let coveredStatements = 0;
  let totalBranches = 0;
  let coveredBranches = 0;
  let totalFunctions = 0;
  let coveredFunctions = 0;
  let totalLines = 0;
  let coveredLines = 0;

  Object.values(data).forEach((file) => {
    // Statements
    Object.values(file.s).forEach((count) => {
      totalStatements++;
      if (count > 0) coveredStatements++;
    });

    // Branches
    Object.values(file.b).forEach((counts) => {
      counts.forEach((count) => {
        totalBranches++;
        if (count > 0) coveredBranches++;
      });
    });

    // Functions
    Object.values(file.f).forEach((count) => {
      totalFunctions++;
      if (count > 0) coveredFunctions++;
    });

    // Lines (approximation from statements or usually calculated from line map,
    // but standard coverage json is complex. Let's use statements as proxy or simple logic if l is present)
    // Actually coverage-final usually has 's', 'f', 'b'. 'l' is sometimes separate or implicit.
    // Istanbul usually tracks statements as valid code lines.
    // Let's stick to Statements/Branches/Functions for the summary unless we find 'l'.
  });

  const getPct = (covered, total) => (total === 0 ? 100 : ((covered / total) * 100).toFixed(2));

  console.log("Global Coverage:");
  console.log(
    `Statements: ${getPct(coveredStatements, totalStatements)}% (${coveredStatements}/${totalStatements})`
  );
  console.log(
    `Branches:   ${getPct(coveredBranches, totalBranches)}% (${coveredBranches}/${totalBranches})`
  );
  console.log(
    `Functions:  ${getPct(coveredFunctions, totalFunctions)}% (${coveredFunctions}/${totalFunctions})`
  );
} catch (e) {
  console.error("Error calculating coverage:", e.message);
}
