# UI Context — Scavvy

## Design Goal

Scavvy should look like a premium character-led adventure app, not a generic AI product or SaaS dashboard.

Visual reference mood:

- warm
- playful
- tactile
- clean
- premium
- adventurous
- slightly game-like
- not childish

## Brand Tokens

### Colors

```text
Scavvy Orange   #FF8A00
Deep Charcoal   #17120F
Adventure Yellow #FFC107
Warm Cream      #FFF6E6
Soft Cream      #FFF1D6
Muted Brown     #6F6257
Success Green   #55A63A
Error Red       #E65A32
```

Use tokens centrally if the app already has a theme system.

Do not introduce random hardcoded hex values where a token exists.

## Typography

Preferred:

- Plus Jakarta Sans
- or a visually similar rounded modern sans-serif

Use:

- bold/extra-bold for display headings
- medium/semibold for buttons
- regular/medium for body

Do not use more than two font families.

## Iconography

Functional UI must use vector/native icons.

Avoid emoji as primary interface icons.

Preferred icon concepts:

- Home: house
- Adventures: compass
- Profile: person
- XP: star
- Streak: flame
- Level: compass/badge
- Time: clock
- Mission: target
- Camera: camera
- Back: chevron-left
- Forward: chevron-right
- Voice: speaker-wave
- Retry: rotate/refresh
- Hint: lightbulb/search
- Achievement complete: check
- Locked: lock

Use one consistent icon family where possible.

## Cards

Cards should generally use:

- large rounded corners
- soft white/cream surfaces
- subtle border
- low-contrast shadow
- generous spacing

Avoid excessive gradients and heavy glassmorphism across the entire UI.

## Buttons

Primary CTA:

- Scavvy orange
- large touch target
- strong label
- one primary CTA per screen

Secondary:

- white/cream or outline
- clearly lower emphasis

Buttons should have subtle press feedback.

## Tab Bar

Main tabs:

- Home
- Adventures
- Profile

Use Expo-native tab behavior and blur/material where appropriate.

Desired feeling:

- floating/translucent
- premium
- native
- rounded
- not a fake heavy glass rectangle

Active state:

- orange
- subtle tinted indicator

Inactive:

- warm gray

Hide tab bar during gameplay.

## Mascot Rules

The attached/provided Scavvy raccoon is the source of truth.

Do not:

- regenerate a new mascot
- change fur pattern
- change clothing identity
- introduce a different illustration style

Use Scavvy strategically.

Preferred states:

- Home: curious/explorer
- Scan: camera/investigating
- Analyzing: thinking
- Success: celebrating
- Failure: confused
- Profile: friendly
- Last Adventure: resting/sleepy
- Achievement: celebratory or curious

Do not make the mascot huge on every screen.

## Home Structure

Preferred hierarchy:

1. Greeting
2. role/level
3. avatar shortcut
4. Scavvy + speech bubble
5. Today's Adventure
6. Your Stats
7. Last Time

## Adventures Structure

Header:

- `Adventures`
- session count
- total XP

Adventure cards show:

- date/time
- title
- short AI summary
- mission count
- XP
- duration
- chevron

## Profile Structure

- profile header
- level/progress
- stats
- favorite adventure
- My Achievements
- Reset Demo Data

Achievement cards:

Unlocked:
- white
- clear check state

Locked:
- warm cream
- lock badge
- percentage
- orange progress bar

## Gameplay Visual Rules

Gameplay should feel immersive.

Mission reveal:
- big prompt
- Scavvy
- strong CTA

Camera:
- minimal overlay
- readable mission prompt
- clear shutter
- no clutter

Analyzing:
- Scavvy-specific copy instead of generic loading

Success:
- short celebration
- captured image
- XP
- voice
- next quest
- clear back/home path

## Animation

Use subtle animation:

- Scavvy wave
- small idle movement
- thinking head/eye movement
- celebration bounce
- short confetti burst
- XP count-up
- speaker animation during voice playback

Do not over-animate every component.

## UX Rule

At all times the user should understand:

1. What am I doing?
2. Why am I doing it?
3. What happens next?
