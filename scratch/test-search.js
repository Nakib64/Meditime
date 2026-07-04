function normalizeSearchQuery(query) {
  if (!query) return "";
  let clean = query.toLowerCase().trim();
  const prefixRegex = /^(dr\b\.?|md\b\.?|mohammad\b|mohammed\b|mrs\b\.?|mr\b\.?|prof\b\.?|professor\b)\s*|^(ডাঃ|ডা\s+|মোঃ|মো\s+|মোহাম্মদ\s+)/gi;
  const removed = clean.replace(prefixRegex, "").trim();
  return removed || clean;
}

function buildPhoneticRegexPattern(query) {
  const clean = normalizeSearchQuery(query);
  if (!clean) return "";

  const words = clean.split(/\s+/).filter(Boolean);
  
  const wordPatterns = words.map(word => {
    const lowerWord = word.toLowerCase();
    
    if (lowerWord === "ahmed" || lowerWord === "ahamed") {
      return "(ahmed|ahamed)";
    }
    if (lowerWord === "mohammad" || lowerWord === "mohammed" || lowerWord === "md") {
      return "(mohammad|mohammed|md)";
    }
    
    let pattern = "";
    let i = 0;
    while (i < word.length) {
      const char2 = word.substring(i, i + 2).toLowerCase();
      const char1 = word.charAt(i).toLowerCase();

      if (char2 === "sh") {
        pattern += "(sh|s)";
        i += 2;
      } else if (char2 === "ee") {
        pattern += "(ee|i|e)";
        i += 2;
      } else if (char2 === "ou") {
        pattern += "(ou|ow)";
        i += 2;
      } else if (char2 === "ow") {
        pattern += "(ow|ou)";
        i += 2;
      } else if (char1 === "s") {
        pattern += "(s|sh)";
        i += 1;
      } else if (char1 === "i") {
        pattern += "(i|ee|e)";
        i += 1;
      } else if (char1 === "e") {
        pattern += "(e|ee|i)";
        i += 1;
      } else if (char1 === "o") {
        pattern += "(o|u)";
        i += 1;
      } else if (char1 === "u") {
        pattern += "(u|o)";
        i += 1;
      } else if (char1 === "z") {
        pattern += "(z|j)";
        i += 1;
      } else if (char1 === "j") {
        pattern += "(j|z)";
        i += 1;
      } else {
        pattern += char1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        i += 1;
      }
    }
    return pattern;
  });

  return wordPatterns.join(".*");
}

const testCases = [
  { input: "Dr. Shamim Ahmed", expectedClean: "shamim ahmed", testMatch: "sameem ahamed" },
  { input: "Md. Samim", expectedClean: "samim", testMatch: "shamim" },
  { input: "Mohammad Zaman", expectedClean: "zaman", testMatch: "jaman" },
  { input: "Dr. Zaman", expectedClean: "zaman", testMatch: "jaman" },
  { input: "ডাঃ শামীম", expectedClean: "শামীম" },
  { input: "মোঃ শফিক", expectedClean: "শফিক" }
];

console.log("=== RUNNING SEARCH UTILS VERIFICATION ===");
testCases.forEach((tc, idx) => {
  const clean = normalizeSearchQuery(tc.input);
  const pattern = buildPhoneticRegexPattern(tc.input);
  console.log(`\nTest Case ${idx + 1}: "${tc.input}"`);
  console.log(`- Clean query: "${clean}" (Expected: "${tc.expectedClean}")`);
  console.log(`- Regex pattern: /${pattern}/i`);
  
  if (tc.testMatch) {
    const rx = new RegExp(pattern, "i");
    const matched = rx.test(tc.testMatch);
    console.log(`- Testing match with "${tc.testMatch}": ${matched ? "✅ MATCHED" : "❌ FAILED"}`);
  }
});
