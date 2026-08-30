# Scavvy — Product Requirements

## 1. Product Summary

Scavvy is a mobile AI-powered real-world scavenger/adventure game.

The product turns the user's immediate physical surroundings into short, playful quests. Scavvy first scans the environment, understands what is present, then creates custom missions that could only make sense in that environment.

The user should feel:

> "I have a little raccoon AI companion that understands where I am and turns it into a game."

Scavvy must not feel like a generic AI assistant.

## 2. Brand

**Name:** Scavvy  
**Tagline:** Your world is the game.

Scavvy is represented by an original raccoon explorer mascot.

Brand personality:

- curious
- mischievous
- warm
- adventurous
- clever
- playful
- premium
- slightly chaotic, never childish

Core colors:

- Scavvy Orange: `#FF8A00`
- Deep Charcoal: `#17120F`
- Adventure Yellow: `#FFC107`
- Warm Cream: `#FFF6E6`
- Soft Cream: `#FFF1D6`
- Muted Brown: `#6F6257`
- Success Green: `#55A63A`
- Error Red: `#E65A32`

Typography direction: modern rounded sans-serif, preferably Plus Jakarta Sans or a visually similar family.

## 3. MVP Goal

The MVP is optimized for a live mobile hackathon demo.

Priority order:

1. Reliable end-to-end gameplay
2. Environment-aware mission generation
3. Camera interaction
4. Scavvy personality
5. Voice reactions
6. Visual polish
7. Progression/history

Do not sacrifice the working demo to add broad product scope.

## 4. Main Navigation

Persistent main tabs:

- Home
- Adventures
- Profile

Use Expo/Expo Router navigation.

The main tab bar should feel native and premium, preferably using Expo-supported native tabs and/or blur/material effects.

Hide the tab bar on immersive gameplay screens.

## 5. Home

Home should include:

- greeting with user name
- role/level, e.g. `Explorer · Level 3`
- small profile shortcut/avatar
- prominent Scavvy mascot
- Scavvy speech bubble
- Today's Adventure card
- duration
- mission count
- difficulty
- `START ADVENTURE` CTA
- user stats
- last adventure card

Home should be vertically scrollable.

The first viewport should prioritize:

1. greeting
2. Scavvy
3. Today's Adventure
4. stats

## 6. Start Adventure

The current core flow is:

Home  
→ Start Adventure  
→ Environment Setup  
→ Scan Space  
→ AI Analyzes Environment  
→ Generate Environment-Aware Quests  
→ Quest Selection  
→ Mission Reveal  
→ Camera Verification  
→ AI Validation  
→ Scavvy Reaction / Voice  
→ XP  
→ Next Quest  
→ Adventure Complete

## 7. Environment Setup

Before scanning, ask:

**"Where are we exploring?"**

Options:

- Home
- Office
- Campus
- Outdoors
- Somewhere Else

This contextual label helps the AI but does not replace visual understanding.

## 8. Scan Space

Scavvy must understand the environment before generating missions.

For MVP:

- open Expo Camera
- capture 3 environment photos
- guide the user between captures
- do not record/analyze continuous video
- do not implement SLAM or 3D room mapping

Suggested scan progress:

- 1 / 3
- 2 / 3
- 3 / 3

Suggested Scavvy copy:

- "Show me around."
- "Nice. Another side."
- "One more."
- "Got it."

## 9. Environment Analysis

The 3 environment images plus the selected location type are analyzed by OpenAI vision.

The AI may derive:

- environment type
- visible objects
- object categories
- colors
- landmarks
- safe quest targets
- possible contextual hints

The raw detected object list should not normally be exposed to the user.

The experience should feel like Scavvy "looked around" and formed ideas.

Do not identify people.

## 10. Quest Generation

Generate 3 quests that are grounded in the scanned environment.

Preferred quest types:

- Observation
- Reasoning
- Visual Clue
- Quick Quest

Good missions require light inference and should not simply name the target.

Examples:

- "Find something that helps people communicate without speaking."
- "I remember seeing something blue. Find it."
- "Find something that becomes much less useful without electricity."
- "Find something ordinary that has a hidden purpose."

Do not generate dangerous, intrusive, illegal, or privacy-sensitive missions.

Do not require interacting with strangers.

## 11. Quest Selection

After analysis:

**"Scavvy found 3 sidequests."**

Show 3 selectable quest cards with:

- quest type
- difficulty
- XP reward
- availability/completion state

Example:

- Observation · Easy · +100 XP
- Brain Quest · Medium · +150 XP
- Quick Quest · Easy · +75 XP

## 12. Mission Play

When a quest is selected:

Mission Reveal  
→ Camera  
→ user finds target  
→ capture one verification photo  
→ validate against mission + environment context

Camera UI must remain minimal and immersive.

## 13. Quest Validation

Validation returns structured output including:

- success
- confidence
- short explanation
- Scavvy reaction

Success should feel rewarding.

Failure should feel playful, not punitive.

## 14. Hint System

Add an `ASK SCAVVY` hint action.

Hints must use the original environment scan so Scavvy appears to remember the space.

Hint levels:

1. subtle
2. more specific
3. almost-reveal

Example:

- "I remember seeing something useful near the front."
- "People usually look at it during presentations."

Hints may be spoken using ElevenLabs.

## 15. Voice

Scavvy voice is used for:

- mission intro
- hint
- success reaction
- failure reaction
- adventure complete reaction

The `PLAY SCAVVY` interaction must produce audible output.

If ElevenLabs is unavailable, use a local mock audio fallback.

Never let the demo appear broken because voice generation fails.

## 16. Mission Success

Mission success should include:

- brief Scavvy celebration animation
- captured photo
- short Scavvy reaction
- XP earned
- `MISSION COMPLETE`
- `NEXT MISSION` / `NEXT SIDEQUEST`
- `PLAY SCAVVY`
- clear path back to Home

Use a short reward animation, not an excessive full-screen game sequence.

## 17. Adventure Complete

After all quests are completed, show:

- Scavvy celebration
- missions completed
- total XP
- streak update
- AI-generated personality observation
- adventure style stats
- Share My Adventure
- Go Again
- Home/back navigation

The user must never be trapped on this screen.

## 18. Adventures

The Adventures tab is the user's history.

Header should show:

- total sessions
- total XP earned

Each adventure card should include:

- relative date/time
- adventure title
- AI-generated summary
- mission count
- XP
- duration
- chevron/detail affordance

Cards are tappable.

Adventure detail should include:

- title
- date/time
- XP
- duration
- mission count
- completed missions
- captured images
- Scavvy reactions
- XP per mission
- Play Again
- Share Adventure
- Back to Adventures

## 19. Profile

Profile includes:

- Scavvy/user avatar
- user name
- Explorer level
- XP progress bar
- total missions
- streak
- adventures completed
- favorite adventure type
- My Achievements
- Reset Demo Data

## 20. Achievements

Achievements must include both unlocked and locked states.

Example unlocked:

**Sharp Eyes**  
Complete 10 observation missions.

**World Watcher**  
Finish adventures in 5 different places.

**Night Owl**  
Finish an adventure after 10pm.

Example locked:

**Agent of Chaos**  
Complete 5 chaos missions without skipping one.

**Streak Keeper**  
Play 7 days in a row.

**Deep Diver**  
Complete a hard mission on the first try.

Locked achievements show progress percentage and progress bar.

Achievement detail may show:

- icon
- title
- description
- current progress
- reward
- unlocked/locked state
- Scavvy reaction

## 21. Icons

Functional UI should use consistent vector/native icons.

Do not use emoji as the primary UI icon system.

Use a single icon family where possible.

## 22. Mascot Usage

Use the provided Scavvy mascot assets as the source of truth.

Do not redesign or replace the mascot.

Recommended states:

- welcome
- idle
- curious
- thinking
- investigating
- success
- confused
- celebrating
- sleepy/resting
- camera
- map

Use Scavvy strategically; do not place a giant mascot on every screen.

## 23. Loading States

Never show generic `Loading...` when a Scavvy-specific state can be used.

Examples:

- "Scavvy is thinking..."
- "Scavvy is investigating..."
- "Scavvy is talking..."

Use subtle animation.

## 24. Failure Fallbacks

For hackathon reliability:

- OpenAI unavailable → deterministic mock missions/results
- ElevenLabs unavailable → local mock voice
- camera unavailable → gallery/sample image fallback
- network error → friendly retry + demo fallback

No infinite spinners.

No blank screens.

No dead buttons.

## 25. Non-Goals for MVP

Do not implement unless explicitly requested:

- real AR object anchoring
- SLAM
- 3D room mapping
- continuous video understanding
- multiplayer
- social feed
- subscriptions
- payments
- admin dashboard
- large analytics system
- complex settings system

## 26. Quality Bar

Scavvy should feel like:

- a polished consumer mobile product
- a character-led adventure game
- camera-native
- AI-powered but not AI-dashboard-like
- emotionally alive through mascot and voice

The wow moment is:

> The judge scans the actual room, and Scavvy creates a mission that clearly came from understanding that exact room.
