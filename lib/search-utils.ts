/**
 * search-utils.ts
 * 
 * Helper functions to clean and normalize search queries and generate phonetic
 * regular expressions that account for common typo patterns in doctor searches.
 */

/**
 * Normalizes a search query by trimming, converting to lowercase, 
 * and ignoring common English and Bangla prefixes (Dr., Md, Mohammad, ডাঃ, মোঃ, etc.)
 */
export function normalizeSearchQuery(query: string): string {
  if (!query) return "";

  let clean = query.toLowerCase().trim();

  // Regex to match prefixes at the start of the query
  // English: dr, md, mohammad, mohammed, mrs, mr, prof, professor (with or without dot)
  // Bangla: ডাঃ, ডা, মোঃ, মো, মোহাম্মদ (followed by space or boundary)
  const prefixRegex = /^(dr\b\.?|md\b\.?|mohammad\b|mohammed\b|mrs\b\.?|mr\b\.?|prof\b\.?|professor\b)\s*|^(ডাঃ|ডা\s+|মোঃ|মো\s+|মোহাম্মদ\s+)/gi;

  const removed = clean.replace(prefixRegex, "").trim();

  // If removing prefix leaves an empty string, fallback to original clean query
  return removed || clean;
}

/**
 * Builds a phonetic regex pattern matching common typos in names.
 * Character mappings covered:
 * - sh <-> s
 * - ee <-> i <-> e
 * - ou <-> ow
 * - o <-> u
 * - z <-> j
 * - ahmed <-> ahamed
 * - mohammad <-> mohammed <-> md
 */
export function buildPhoneticRegexPattern(query: string): string {
  const clean = normalizeSearchQuery(query);
  if (!clean) return "";

  // Split query into words to match each word
  const words = clean.split(/\s+/).filter(Boolean);

  const wordPatterns = words.map(word => {
    const lowerWord = word.toLowerCase();

    // Explicit word-level substitutions
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
        // Escape regex special characters
        pattern += char1.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        i += 1;
      }
    }
    return pattern;
  });

  return wordPatterns.join(".*");
}

/**
 * Creates a case-insensitive RegExp from the phonetic regex pattern
 */
export function buildPhoneticRegex(query: string): RegExp | null {
  const pattern = buildPhoneticRegexPattern(query);
  if (!pattern) return null;
  return new RegExp(pattern, "i");
}
