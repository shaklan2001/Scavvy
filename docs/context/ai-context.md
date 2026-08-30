# AI Context — Scavvy

## Purpose

AI is invisible infrastructure.

The user interacts with Scavvy, not with "OpenAI."

The AI exists to make Scavvy appear observant, contextual, playful, and adaptive.

## OpenAI Responsibilities

OpenAI may handle:

- environment understanding from images
- environment-aware quest generation
- quest validation
- contextual hint generation
- Scavvy reaction text
- adaptive difficulty
- adventure summary
- lightweight personality observations

## ElevenLabs Responsibilities

ElevenLabs may handle:

- Scavvy mission intro
- Scavvy hints
- success reactions
- failure reactions
- adventure complete narration

## Environment Analysis

Input:

- 3 environment images
- selected location type

Output should be structured.

Suggested schema:

```json
{
  "environmentType": "office",
  "visibleObjects": ["projector", "laptop", "backpack", "bottle"],
  "colors": ["blue", "black", "silver"],
  "landmarks": ["projector screen", "front desk"],
  "possibleQuestTargets": ["projector", "blue backpack", "bottle"],
  "possibleHints": [
    "near the front",
    "used during presentations"
  ]
}
```

## Privacy Rule

Do not identify people.

Do not infer personal identity, sensitive traits, or private data from environment images.

Avoid reading or using private documents/screens as quest content.

## Quest Generation Rules

Generate quests grounded in detected environment context.

Do:

- use light reasoning
- reference visible categories/colors/locations indirectly
- create variety
- keep tasks safe
- keep tasks achievable in the scanned area

Do not:

- name a target too directly unless difficulty calls for it
- require strangers
- require touching other people's property
- require unsafe movement
- require entering restricted areas
- create illegal or intrusive tasks

## Quest Variety

Preferred categories:

### Observation
Find something matching a visual or functional clue.

### Reasoning
Infer a target from what it does.

### Visual Clue
Use color, relative location, shape, or other visual property.

### Quick Quest
Fast low-complexity mission.

## Validation

Validation input:

- mission
- environment context
- verification image

Suggested output:

```json
{
  "success": true,
  "confidence": 0.92,
  "explanation": "A projector helps people communicate visually during presentations.",
  "scavvyReaction": "Yep. That's exactly the kind of thing I meant."
}
```

Keep explanations short.

## Hint Rules

Hints must use environment context.

Hint level 1:
subtle spatial/category clue

Hint level 2:
more specific function/location clue

Hint level 3:
nearly reveals the intended target

Do not invent a target that was not supported by the scan.

## Scavvy Voice Style

Voice should feel:

- energetic
- warm
- clever
- mischievous
- concise
- never robotic
- never over-explain

Good:

`Nice. You found it. Let's make the next one harder.`

Bad:

`Your input has been successfully validated by the image recognition model.`

## Structured Output

Prefer typed/structured responses over free-form text for core game logic.

The UI should not parse important state from prose.

## Failure Handling

Every live AI call must have:

- timeout/error handling
- retry option where appropriate
- deterministic fallback
- no infinite loading

## Demo Fallbacks

Suggested seeded fallback environment:

```json
{
  "environmentType": "office",
  "visibleObjects": ["laptop", "chair", "bottle", "backpack", "projector"],
  "colors": ["blue", "black", "silver"],
  "landmarks": ["front of room"],
  "possibleQuestTargets": ["projector", "blue backpack", "bottle"],
  "possibleHints": ["near the front", "used during presentations"]
}
```

Suggested fallback quests:

1. `Find something that helps people communicate without speaking.`
2. `I remember seeing something blue. Find it.`
3. `Find something that becomes much less useful without electricity.`

## Audio Fallback

If ElevenLabs is unavailable:

- use bundled local audio if present
- or use a reliable local/demo-safe fallback

The `PLAY SCAVVY` control must never silently do nothing.
