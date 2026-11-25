// Text checks for public wins. Plain TypeScript with no runtime-specific APIs,
// so the moderate-win Edge Function (Deno) and the Next.js app share one copy.
//
// Deliberately simple and conservative: it should catch obvious spam and
// hostility without ever making someone feel policed for writing about a hard day.

export type ModerationResult = {
  allowed: boolean;
  reason: "spam" | "hurtful" | null;
  /** A kind sentence to show the writer when the win can't be shared publicly. */
  message: string | null;
  /** True when the text suggests the person may be struggling. Never blocks anything. */
  suggestSupport: boolean;
};

const URL_PATTERN = /(https?:\/\/|www\.)\S+|\b[a-z0-9-]+\.(com|net|org|io|ru|xyz|top|biz|info|shop|link|click)\b/i;
// Twenty of the same character in a row is keyboard spam; "soooo happy" is not.
const REPEATED_CHARACTER = /(.)\1{19,}/u;
const CONTACT_PATTERN = /\b(whats\s?app|telegram|dm me|contact me|follow me|subscribe|promo code|discount code)\b/i;

// Insults aimed at another person. Words about oneself on a bad day ("I felt stupid")
// are fine; these patterns look for "you"-directed hostility and common abuse.
const HURTFUL_PATTERNS = [
  /\byou(?:'re| are|r)?\s+(?:so\s+|such\s+an?\s+)?(?:stupid|idiot|idiots|pathetic|worthless|ugly|disgusting|loser|trash|garbage)\b/i,
  /\b(?:kill|hang|shoot)\s+your\s*self\b/i,
  /\bkys\b/i,
  /\b(?:go\s+die|hope\s+you\s+die|nobody\s+likes\s+you|everyone\s+hates\s+you)\b/i,
  /\bshut\s+up\b.*\byou\b/i,
];

// Phrases that suggest someone is having a very hard time. Used only to offer support.
const STRUGGLE_PATTERNS = [
  /\b(?:kill|hurt|harm)(?:ing)?\s+my\s*self\b/i,
  /\bself[-\s]?harm/i,
  /\b(?:want|wanted|wanting)\s+to\s+die\b/i,
  /\bend(?:ing)?\s+(?:it\s+all|my\s+life)\b/i,
  /\b(?:no|not\s+any)\s+(?:reason|point)\s+(?:to|in)\s+(?:live|living|going\s+on)\b/i,
  /\bcan(?:'|no)?t\s+go\s+on\b/i,
  /\bsuicid/i,
  /\bbetter\s+off\s+without\s+me\b/i,
];

export function suggestsStruggle(text: string): boolean {
  return STRUGGLE_PATTERNS.some((pattern) => pattern.test(text));
}

export function moderateText(text: string): ModerationResult {
  const suggestSupport = suggestsStruggle(text);

  if (URL_PATTERN.test(text) || CONTACT_PATTERN.test(text) || REPEATED_CHARACTER.test(text)) {
    return {
      allowed: false,
      reason: "spam",
      message: "Public wins can't include links, ads or contact details. You can still keep this one just for you.",
      suggestSupport,
    };
  }

  if (HURTFUL_PATTERNS.some((pattern) => pattern.test(text))) {
    return {
      allowed: false,
      reason: "hurtful",
      message: "The feed is a gentle place, so this one can't be shared publicly. You can still keep it just for you.",
      suggestSupport,
    };
  }

  return { allowed: true, reason: null, message: null, suggestSupport };
}
