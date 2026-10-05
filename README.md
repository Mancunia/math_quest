# Maths Quest

A maths game for kids aged 5 to 11, built with Next.js. Each child can have a player profile that keeps their stars and progress, and scores go on a shared leaderboard. Everything is saved in the browser, so nothing needs a server, a database or an online account. Anonymous visit counts are collected with Vercel Web Analytics (see [Analytics](#analytics)).

## Setup

### What you need

- [Node.js](https://nodejs.org) 20.9 or newer (Next.js 16 needs it). Check with `node -v`.
- npm, which comes with Node. pnpm works too, since the repo has a `pnpm-lock.yaml` as well.

No environment variables, API keys or database are needed.

### Install and run

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000. The page reloads by itself when you edit the code.

To test on a tablet or phone on the same Wi-Fi, open `http://<your-computer's-IP>:3000` on that device.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Starts the development server on port 3000 |
| `npm run build` | Makes an optimised production build in `.next/` |
| `npm start` | Serves the production build (run `build` first) |
| `npm run typecheck` | Checks the TypeScript types without building |

### Deploying

The app is a normal Next.js app with no server-side data, so it runs anywhere Next.js runs: Vercel, Netlify, or any Node host using `npm run build` then `npm start`. Each visitor's profiles and scores stay in their own browser, so deploying doesn't share data between devices.

### Troubleshooting

- **Port 3000 is busy:** run `npm run dev -- -p 3001` and open http://localhost:3001.
- **Odd build errors after updating packages:** delete `.next/` and `node_modules/`, then run `npm install` again.
- **Scores or profiles disappeared:** they're in the browser's `localStorage`. A different browser, a private window or clearing site data starts afresh.

## How it works

### The big picture

The whole game is one client-side React component. `app/page.tsx` renders `<Game />`, and `components/Game.tsx` (a `"use client"` component) holds all the state and switches between screens:

```
players ─▶ home ─▶ tables (Times Tables only) ─▶ play ─▶ results
             │                                    ▲
             ├─▶ lesson (topics with one) ────────┘
             │                                              │
             ├─▶ leaderboard ◀──────────────────────────────┘
             └─▶ progress
```

There are no other routes or API calls. Saved data is read from `localStorage` once, when the page first loads in the browser, and written back whenever something changes.

### A round

1. On **Home** the child picks a level, game type, answer style and topic. Settings save straight away for the current player.
2. `Game.start()` creates a run and shows **Play**, which asks `generate(topic, level, tables)` in `lib/questions.ts` for each question. It skips repeats in the same round.
3. Each question is a plain object (`Question` in `lib/types.ts`): text, answer, optional multiple choices, a picture (`visual`), a hint with its own picture, and an explanation. `Visual.tsx` draws the pictures and `RichText.tsx` draws blanks (`__`) and stacked fractions (`{3/4}`).
4. A per-question timer runs (5–60 s, set per level). After 25% of the time the hint opens by itself. When the time runs out, the question counts as a miss.
5. When the round ends, `Game.finish()` works out stars with `starsFor()` in `lib/topics.ts`:
   - **10 questions:** 3 stars for 90%+ correct, 2 for 70%+, 1 for 50%+.
   - **60-second race:** a target score per level (Easy 6/10/14, Medium 5/9/13, Hard 4/7/10).
6. It then saves the game to the player's history, updates their best stars and adds the score to the leaderboard. Practice rounds go into the history only.

### Where data is saved

Every key in `localStorage` starts with `mq_` (see `lib/storage.ts`). Reads and writes are wrapped in `try`/`catch`, so the game still works without saving if storage is blocked.

| Key | Holds |
| --- | --- |
| `mq_profiles` | The list of player profiles |
| `mq_current` | The id of the last player picked |
| `mq_p_<id>_settings` | A profile's settings |
| `mq_p_<id>_best` | A profile's best stars per topic and level |
| `mq_p_<id>_games` | A profile's game history (last 1000 games) |
| `mq_settings`, `mq_best` | The guest's settings and best stars |
| `mq_leaderboard` | Shared leaderboard (top 300 scores) |

`sessionStorage` key `mq_unlocked` remembers which PIN-protected profile was unlocked in this browser session.

### Adding or changing a topic

- To make a topic easier or harder, edit its generator in `lib/questions.ts`. Each one gets the level (`0`, `1` or `2`) and the chosen times tables.
- To add a topic, add its id to `TopicId` in `lib/types.ts`, an entry to `TOPICS` in `lib/topics.ts`, and a generator with the same id in `lib/questions.ts`. TypeScript will flag anything missing. Run `npm run typecheck` to check.
- To give a topic a lesson, add a list of cards for each level (Easy, Medium, Hard) to `LESSONS` in `lib/lessons.ts`. Each card has a title, some text and an optional picture. Picking the topic then shows the lesson first; **Play again** and **Practise my mistakes** skip it.
- Shape facts (sides, symmetry, faces, edges, vertices) and their drawings live in `lib/shapes.ts`, so a picture and its answer always agree.

## What's in the game

- **13 topics:** addition, subtraction, multiplication, division, times tables (choose which ones), counting, bigger or smaller (<, >, =), missing number, number patterns, fractions, telling time, shapes, and a mixed challenge.
- **Shapes** follows the school curriculum: Easy names flat shapes and counts sides and corners; Medium adds shapes up to 8 sides, 3D shape names and lines of symmetry; Hard covers faces, edges and vertices, acute/right/obtuse/reflex angles, perimeter and area. Each round starts with a short picture lesson for the chosen level, with a **Skip to the quiz** button.
- **3 levels:** Easy (ages 5–6), Medium (7–8) and Hard (9–11).
- **2 game types:** 10 questions at your own pace, or a 60-second race.
- **2 ways to answer:** tap one of 4 answers, or type on a number pad (keyboard works too).
- **A clock on every question:** 10 seconds each by default. You can set the time (5 to 60 seconds) separately for Easy, Medium and Hard under **Time per question**. After a quarter of the time, the hint opens by itself with a picture guide (column method, skip-counting jumps, number lines, pattern gaps, a minute ring on the clock, and more). If the time runs out, it counts as a miss and the answer is shown.
- Hints with pictures, explanations for wrong answers, stars, streaks, sounds and confetti.
- Light, dark or automatic theme.
- **Practise my mistakes** replays just the questions a child got wrong.
- **How to play** (button at the top, or the link on the home screen) walks through the steps, levels, topics, keyboard shortcuts and common questions.

## Analytics

Traffic is measured with [Vercel Web Analytics](https://vercel.com/docs/analytics) (`@vercel/analytics`). It uses no cookies and stores nothing in the browser.

- `<Analytics />` in `app/layout.tsx` records page views: visitors, referrers, countries and devices.
- `lib/analytics.ts` sends custom events from `components/Game.tsx`:

| Event | When | Properties |
| --- | --- | --- |
| `screen_view` | A screen opens | `screen` (home, play, results, leaderboard…) |
| `round_start` | A round begins | `topic`, `level`, `mode`, `practice` |
| `round_finish` | A round ends | the above plus `score`, `answered`, `stars` |
| `profile_created` | A new player profile is made | none |

Names, profile ids, PINs and leaderboard entries are never sent. Add new events to `lib/analytics.ts` and keep them anonymous.

Data only arrives when the app is deployed on Vercel with **Analytics** enabled in the project dashboard. Custom events need a Pro plan; on Hobby only page views show. In `npm run dev` nothing is sent: events are logged to the browser console instead.

## Player profiles

- **Who's playing?** Tap the player button at the top to pick a profile, make a new one (name, picture and an optional 4-number PIN), or play as a guest.
- Each profile keeps its own settings, best stars and a history of every game, practice rounds included. The last player is remembered next time.
- **My progress** shows stars (out of 117), games played, how many answers were right, days played in a row, stars for every topic at each level, topics worth practising, and recent games. It's also where you change your name, picture or PIN, or delete the profile.
- A PIN is asked for again in each new browser session. It stops brothers and sisters mixing up profiles; it is not a password. **Forgot the PIN?** answers a grown-up multiplication question to remove it.
- Deleting a profile removes its stars, history and leaderboard scores.
- If a name was saved before profiles existed, that player becomes the first profile and keeps their stars and scores.
- Profiles live in this browser only, like the leaderboard. They don't follow a child to another device.

## Leaderboard

- Every finished game (not practice rounds) is saved with the player's name. Profile players are saved automatically; for guests with no name set, the results screen asks for one.
- Filter by game type, level and topic.
- 10-question games rank by correct answers, then the quickest time. Races rank by correct answers, then accuracy.
- Everything lives in the browser's `localStorage`, so scores stay on that computer and browser only. Clearing site data, or using a private window, starts a fresh board. There's a **Clear the leaderboard** button with a confirmation step.

## Project layout

```
app/
  layout.tsx      page shell and fonts
  page.tsx        renders the game
  globals.css     all styles
  icon.svg        browser tab icon
components/
  Game.tsx        screens, settings, saving scores
  Home.tsx        settings and topic picker
  TablesPicker.tsx
  Play.tsx        a round: questions, answers, timer, keyboard
  Results.tsx     stars, leaderboard placing, mistakes
  Leaderboard.tsx filters and ranked table
  Players.tsx     who's playing: pick, create, PIN check
  ProfileForm.tsx name, picture and PIN
  Progress.tsx    a player's stats, stars and recent games
  HowTo.tsx       how-to-play guide and FAQ
  Segment.tsx     the row-of-buttons picker used in settings
  Lesson.tsx      picture lesson cards shown before a round
  Visual.tsx      clock, fraction shapes, dots, blocks, objects, 2D/3D shapes, angles
  RichText.tsx    blanks and stacked fractions in question text
lib/
  questions.ts    question generators for every topic and level
  topics.ts       topic list, levels, timings, star rules
  lessons.ts      lesson cards per topic and level
  shapes.ts       shape facts and drawing points
  storage.ts      localStorage settings, best stars, leaderboard
  analytics.ts    anonymous Vercel Web Analytics events
  profiles.ts     player profiles, game history, progress stats
  effects.ts      sounds and confetti
  types.ts        shared types
```
