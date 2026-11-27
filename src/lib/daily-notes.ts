import { daysBetween } from "./dates";

export type DailyNote = {
  /** A well-supported finding, worded carefully: "research suggests", not "science proves". */
  fact: string;
  /** How the finding connects to what the person is already doing in Glowjar. */
  cheer: string;
};

// One note a day, in the person's own timezone. Kept gentle and accurate: each
// fact is a widely cited finding, phrased without overclaiming.
export const DAILY_NOTES: readonly DailyNote[] = [
  {
    fact: "In studies of people's workdays, the thing that lifted mood and motivation most was making progress, even small progress, on something that mattered to them.",
    cheer: "Every light you add is one of those small steps forward. They count more than they look.",
  },
  {
    fact: "People who wrote down three good things each day for a week were happier, and less down, even six months later.",
    cheer: "That's the habit you're building here, one little light at a time.",
  },
  {
    fact: "The brain gives bad moments more weight than good moments of the same size. Psychologists call it the negativity bias.",
    cheer: "Noticing the good on purpose balances the scales. Your jar is doing exactly that.",
  },
  {
    fact: "Savouring, pausing to relive a good moment for a few seconds, helps the good feeling last longer.",
    cheer: "Rereading an old win in your jar is savouring. Take a moment with one today.",
  },
  {
    fact: "Putting a feeling into words, even a single word, can make it feel less intense. Researchers call it affect labelling.",
    cheer: "A quick mood check-in is a quiet way of doing it, and only you can see it.",
  },
  {
    fact: "In one study, new habits took about 66 days on average to feel automatic, and missing a day now and then didn't undo the progress.",
    cheer: "That's why your streak has rest days. A pause isn't a reset.",
  },
  {
    fact: "Treating yourself with kindness after a setback is linked to more motivation to improve, not less.",
    cheer: "Talk to yourself the way you'd talk to a friend. You're doing better than you think.",
  },
  {
    fact: "Doing small kind things for others reliably lifts the wellbeing of the person doing them.",
    cheer: "Celebrating someone else's win in the feed counts as one.",
  },
  {
    fact: "In a study of about 20,000 people, those who spent around two hours a week in nature reported better health and wellbeing.",
    cheer: "A short walk outside could be today's light.",
  },
  {
    fact: "After a poor night's sleep, people tend to see neutral things more negatively than they really are.",
    cheer: "If today feels heavy, be gentle with yourself. One small win is plenty.",
  },
  {
    fact: "Writing openly about your thoughts and feelings for a few minutes has been linked to better wellbeing in many studies.",
    cheer: "A letter to your future self is one way to try it.",
  },
  {
    fact: "People who feel more connected to their future selves tend to make choices that serve them later on.",
    cheer: "Every win you write down is a message to the person you're becoming.",
  },
  {
    fact: "One of the longest-running studies of adult life found that warm relationships were among the strongest predictors of a happy, healthy life.",
    cheer: "Sharing a win, or cheering someone else's, is a small way of staying connected.",
  },
  {
    fact: "People are more likely to start new goals at fresh starts, like a new week or month. Researchers call it the fresh start effect.",
    cheer: "Any morning can be a fresh start. Today is one.",
  },
  {
    fact: "Deciding when and where you'll do something (\"after breakfast, I'll…\") makes you much more likely to follow through.",
    cheer: "Pick a moment today to notice one thing that went right.",
  },
  {
    fact: "We get used to good things quickly. Noticing them again on purpose brings back some of their glow.",
    cheer: "Your jar keeps the good things from fading into the background.",
  },
  {
    fact: "We tend to remember an experience by its most intense moment and by how it ended.",
    cheer: "Ending your day with a win helps shape how you remember it.",
  },
  {
    fact: "People who wrote and delivered a thank-you letter felt a lift in happiness that lasted about a month.",
    cheer: "Is there someone who helped one of your wins happen?",
  },
  {
    fact: "Even short bursts of movement can lift your mood soon afterwards.",
    cheer: "A stretch, a walk to the window, a few stairs. Tiny counts.",
  },
  {
    fact: "When someone shares good news, responding with real enthusiasm strengthens the relationship. Psychologists call it capitalisation.",
    cheer: "Celebrating someone's win in the feed means more than it seems.",
  },
  {
    fact: "Telling someone about a good thing that happened tends to make the good feeling bigger.",
    cheer: "Sharing a win publicly, or just telling a friend, lets it glow twice.",
  },
  {
    fact: "Slow breathing, with breaths out that are longer than breaths in, can help calm the body's stress response.",
    cheer: "If you need it, the breathing exercise on the Hard day screen is there for you.",
  },
  {
    fact: "In a study that checked in with people through the day, they were less happy when their minds wandered than when they were focused on what they were doing.",
    cheer: "Writing down a win brings you back to the moment, even briefly.",
  },
  {
    fact: "People overestimate how much others notice their mistakes. Psychologists call it the spotlight effect.",
    cheer: "Most people are far kinder, and far less watchful, than we fear.",
  },
  {
    fact: "People tend to put in more effort as they get closer to a goal. Researchers call it the goal-gradient effect.",
    cheer: "Your next glow milestone is closer than it was yesterday.",
  },
  {
    fact: "Listening to music you love releases dopamine, one of the brain's feel-good chemicals.",
    cheer: "Put on a song you love. That can be today's win.",
  },
  {
    fact: "Writing for a few minutes about your best possible future has been shown to boost optimism.",
    cheer: "Your jar is quietly building the evidence that good things keep happening.",
  },
  {
    fact: "Reflecting on the values that matter most to you can soften how your body reacts to stress.",
    cheer: "Many of your wins show what you care about. That's worth noticing.",
  },
  {
    fact: "Small, regular positive moments add up to more lasting wellbeing than rare big ones.",
    cheer: "That's the whole idea of your jar: little lights, often.",
  },
  {
    fact: "Simply noticing what went well, without changing anything else, has been linked to feeling more hopeful.",
    cheer: "You don't need a big day. You just need to notice one good thing.",
  },
];

// Stepping through the list by a number with no common factor with its length
// visits every note once per cycle, and neighbouring days never repeat.
const STRIDE = 7;
const EPOCH = "2026-01-01";

/** Today's note for a "YYYY-MM-DD" local date. The same date always gives the same note. */
export function noteForDate(isoDate: string): DailyNote {
  const day = daysBetween(EPOCH, isoDate);
  const length = DAILY_NOTES.length;
  const index = (((day * STRIDE) % length) + length) % length;
  return DAILY_NOTES[index];
}
