import { track } from "@vercel/analytics";
import type { Level, Mode, TopicId } from "./types";

// Anonymous usage events for Vercel Web Analytics. Never send names, profile ids or PINs:
// only screen names and game details. Wrapped so analytics can never break the game.

const send = (event: string, props?: Record<string, string | number | boolean>) => {
  try {
    // `track` drops events until <Analytics /> sets up `window.va`, and Game's first effects run
    // before it does. Set up the same queue the library uses, so early events wait for the script.
    window.va ??= (...params) => {
      (window.vaq ??= []).push(params);
    };
    track(event, props);
  } catch {
    // ignore
  }
};

export const trackScreen = (screen: string) => send("screen_view", { screen });

export const trackRoundStart = (r: { topic: TopicId; level: Level; mode: Mode; practice: boolean }) =>
  send("round_start", { topic: r.topic, level: r.level, mode: r.mode, practice: r.practice });

export const trackRoundFinish = (r: {
  topic: TopicId; level: Level; mode: Mode; practice: boolean; score: number; answered: number; stars: number;
}) =>
  send("round_finish", {
    topic: r.topic, level: r.level, mode: r.mode, practice: r.practice, score: r.score, answered: r.answered, stars: r.stars,
  });

export const trackProfileCreated = () => send("profile_created");
