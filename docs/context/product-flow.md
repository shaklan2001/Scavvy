# Product Flow — Scavvy

## Main Navigation

```text
Home
Adventures
Profile
```

These tabs are persistent outside gameplay.

## Primary Gameplay Flow

```text
HOME
  ↓
START ADVENTURE
  ↓
ENVIRONMENT SETUP
  ↓
SCAN SPACE (3 photos)
  ↓
SCAVVY ANALYZES SPACE
  ↓
GENERATE 3 SIDEQUESTS
  ↓
QUEST SELECTION
  ↓
MISSION REVEAL
  ↓
CAMERA SEARCH
  ↓
VERIFICATION PHOTO
  ↓
AI VALIDATION
  ↓
SUCCESS / TRY AGAIN
  ↓
SCAVVY VOICE + XP
  ↓
NEXT SIDEQUEST
  ↓
ALL COMPLETE?
  ├─ NO → QUEST SELECTION
  └─ YES → ADVENTURE COMPLETE
                 ↓
              HOME
```

## Home Flow

Home includes:

- greeting
- user level
- Scavvy speech
- Today's Adventure
- Start Adventure
- stats
- last adventure

Actions:

```text
START ADVENTURE → Environment Setup
Last Adventure → Adventure Detail
Profile Avatar → Profile
```

## Environment Setup

Prompt:

`Where are we exploring?`

Choices:

- Home
- Office
- Campus
- Outdoors
- Somewhere Else

Then:

`SCAN MY SPACE`

## Scan Space

Camera captures 3 images.

Suggested copy:

Photo 1:
`Show me around.`

Photo 2:
`Nice. Another side.`

Photo 3:
`One more.`

After final capture:

`Scavvy is looking around...`

## Analyze Space

Do not expose raw detections.

Animated copy can progress through:

- Scavvy is looking around...
- Interesting...
- I've got some ideas.

On success:

→ Quest Selection

On provider failure:

→ use fallback environment/quests and continue

## Quest Selection

Show:

`Scavvy found 3 sidequests.`

Each quest displays:

- type
- difficulty
- XP
- completion status

Selecting a quest starts Mission Reveal.

Completed quests remain visible and marked complete.

## Mission Reveal

Display:

- mission number
- quest type
- mission prompt
- optional Scavvy line
- CTA: `FIND IT`

Back behavior:

- return to Quest Selection

## Camera Search

Show:

- current mission
- shutter
- gallery fallback if available
- optional `ASK SCAVVY`

Do not clutter the live view.

## Hint Flow

`ASK SCAVVY`

→ generate context-aware hint

→ show short text

→ optionally play Scavvy voice

Hint level increments each request.

## Validation

After photo:

`Scavvy is investigating...`

Then either:

### Success
- That counts
- photo
- short explanation
- XP
- Play Scavvy
- Next Sidequest
- Home/back affordance

### Failure
- playful correction
- Try Again
- Make It Easier / Hint
- Home/back affordance

## Adventure Completion

After all quests:

- celebration
- mission count
- XP
- streak
- personality observation
- optional style scores
- Share My Adventure
- Go Again
- Home

## Adventures Tab

List previous sessions.

Tap card:

→ Adventure Detail

Detail:

- metadata
- mission history
- photos
- reactions
- Play Again
- Share
- Back

## Profile

Sections:

- profile / level
- XP progress
- stats
- favorite adventure
- My Achievements
- Reset Demo Data

Achievement tap:

→ detail modal/screen

## Demo Reset

Reset Demo Data should:

- confirm first
- restore seeded demo stats
- restore seeded adventure history
- restore achievement demo states
- not remove required app configuration
