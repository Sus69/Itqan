# Navigation & User Flows
## Itqān Navigation Architecture

> Version: 1.0
> Status: Foundational Document
> Depends on:
> - vision/vision.md
> - architecture/product-ecosystem.md
>
> Purpose:
> Define how users move throughout Itqān, how different systems connect together, and the principles that govern navigation across the platform.
>
> This document defines navigation behavior, not visual UI.

---

# 1. Navigation Philosophy

Navigation should never make users think about features.

Instead, navigation should naturally guide users toward accomplishing their goals.

The application should always encourage progress rather than exploration.

A learner should never wonder:

> "What should I do now?"

The application should always provide a meaningful next action.

---

# 2. Navigation Principles

## Continue Before Explore

Whenever possible, users should be encouraged to continue unfinished work before starting something new.

Examples:

- Continue today's lesson
- Continue yesterday's practice
- Resume interrupted recording

---

## Goals Before Features

Navigation should focus on user intentions rather than product features.

Users think:

- I want to learn.
- I want to practice.
- I want to improve.

They do not think:

- I want to use Feature X.

---

## Minimize Navigation Depth

Every important activity should be reachable within three interactions.

Users should never need to drill through multiple nested menus simply to begin learning.

---

## One Primary Action Per Screen

Each screen should encourage one clear action.

Avoid presenting multiple competing calls-to-action.

---

## Progress Should Always Be Visible

Users should always understand:

- where they are
- what they are doing
- what comes next

---

## No Dead Ends

Every completed action should naturally lead to another meaningful action.

Examples:

Lesson Complete

↓

Next Lesson

or

Practice Weak Areas

or

Return Home

---

# 3. Global Navigation

The application consists of five primary navigation destinations.

```

```
🏠 Home

📚 Learn

🎤 Practice

📈 Progress

👤 Profile
```

```md

These destinations remain consistent throughout the application.

---

# 4. Home

Purpose:

Acts as the central dashboard for the learner.

Home is designed around continuation, not discovery.

Primary responsibilities:

- Resume learning
- Show daily progress
- Display recommended next action
- Surface practice reminders
- Highlight achievements
- Provide quick access to Voice Matching (when appropriate)

Home should answer one question:

"What should I do next?"

---

# 5. Learn

Purpose:

Deliver structured educational content.

Contains:

- Qaida
- Tajweed

Hierarchy:

Learn

↓

Course

↓

Module

↓

Chapter

↓

Lesson

↓

Lesson Session

↓

Completion

---

# 6. Practice

Purpose:

Strengthen existing knowledge.

Unlike Learn, Practice contains no required learning sequence.

Users may practice:

- Weak areas
- Individual rules
- Letters
- Pronunciation
- Recording exercises
- AI-guided repetition
- Revision sessions

Practice should remain available after all lessons are completed.

---

# 7. Progress

Purpose:

Provide meaningful insight into the learner's development.

Displays:

- Learning progress
- Practice history
- Lesson completion
- Rule mastery
- Voice development (future)
- Streaks
- Achievements

The Progress section exists to motivate reflection rather than competition.

---

# 8. Profile

Purpose:

Manage personal settings and preferences.

Includes:

- Account
- Preferred Qari
- Learning preferences
- Settings
- Accessibility
- Notification preferences

Future additions:

- Teacher Mode
- Parent Dashboard

---

# 9. Voice Matching Navigation

Voice Matching is not a permanent navigation destination.

Instead, it functions as a guided experience that introduces users to personalized learning.

Entry Points:

• First-time onboarding

• Home recommendation

• Profile

• Practice (optional future shortcut)

Flow:

Home

↓

Find Your Reference Qari

↓

Voice Recording

↓

Voice Analysis

↓

Recommendation

↓

Reference Recitations

↓

Return Home

The recommended Qari becomes part of the user's profile and may be used throughout future learning experiences.

---

# 10. Primary User Flows

## Journey 1 — New User

Launch

↓

Onboarding

↓

Voice Matching

↓

Recommendation

↓

Home

↓

Begin Learning

---

## Journey 2 — Learning Qaida

Home

↓

Continue Learning

↓

Qaida

↓

Lesson

↓

Practice

↓

Completion

↓

Next Lesson

---

## Journey 3 — Learning Tajweed

Home

↓

Continue Learning

↓

Tajweed

↓

Lesson

↓

Listen

↓

Practice

↓

Record

↓

AI Feedback

↓

Retry

↓

Complete

↓

Next Lesson

---

## Journey 4 — Daily Practice

Home

↓

Practice

↓

Weak Areas

↓

Recording

↓

AI Feedback

↓

Improvement

↓

Return Home

---

## Journey 5 — Revisit Voice Match

Profile

↓

Reference Qari

↓

Compare Again

↓

New Recommendation

↓

Save

---

# 11. Cross-System Navigation

Every major system should naturally connect to related systems.

Examples:

Lesson Complete

↓

Practice

Practice Complete

↓

Progress

Voice Match Complete

↓

Reference Recitations

Reference Recitations

↓

Tajweed Lessons

Weak Rule Detected

↓

Recommended Practice

The learner should feel guided rather than manually navigating.

---

# 12. Navigation States

Every page should account for different user states.

Examples:

First Visit

Returning User

Lesson In Progress

Lesson Completed

Practice Available

Offline

No Progress

Voice Match Not Completed

Voice Match Completed

These states influence available actions but should not alter the overall navigation structure.

---

# 13. Navigation Hierarchy

```

```
ITQĀN

├── Home
│
├── Learn
│   ├── Qaida
│   └── Tajweed
│
├── Practice
│   ├── Daily Practice
│   ├── Weak Areas
│   ├── Revision
│   └── Recording Practice
│
├── Progress
│
└── Profile
    ├── Voice Match
    ├── Settings
    ├── Preferences
    └── Accessibility
```

```md

---

# 14. Future Navigation

The architecture should support future systems without requiring major restructuring.

Potential additions include:

- Hifz
- Teacher Dashboard
- Parent Dashboard
- Community
- Certifications
- Offline Downloads

New systems should integrate into the existing navigation philosophy rather than introducing additional primary navigation destinations.

---

# 15. Navigation Success Criteria

Navigation is considered successful when users:

- Always know what to do next.
- Can reach any major activity within three interactions.
- Rarely feel lost.
- Naturally continue learning over multiple sessions.
- Experience a consistent flow regardless of which learning path they choose.

Navigation should disappear into the background, allowing learners to focus entirely on reciting, learning, and improving rather than figuring out how to use the application.


---

# 16. Navigation Decision Matrix

Different users enter Itqān with different objectives.

Rather than exposing every feature equally, the application should guide users toward the most appropriate experience based on their current goal and learning stage.

| User Goal | Primary Destination | Secondary Destination |
|-----------|--------------------|----------------------|
| Find a suitable Qari | Voice Matching | Reference Recitations |
| Learn Arabic reading | Qaida | Practice |
| Learn Tajweed | Tajweed | Practice |
| Improve existing recitation | Practice | Tajweed |
| Continue yesterday's work | Home | Continue Learning |
| Review previous lessons | Practice | Progress |

The application should prioritize these destinations dynamically whenever possible.

---

# 17. User States

Navigation adapts depending on where the learner currently is in their journey.

## First-Time User

Characteristics

- No completed onboarding
- No reference Qari
- No learning history

Recommended Flow

Launch

↓

Onboarding

↓

Voice Matching

↓

Recommendation

↓

Home

↓

Begin Learning

---

## Beginner

Characteristics

- Learning Qaida
- Building Arabic reading ability

Navigation Priority

Continue Qaida

↓

Practice Letters

↓

Progress

---

## Intermediate Learner

Characteristics

- Reading Arabic confidently
- Studying Tajweed

Navigation Priority

Continue Tajweed

↓

Practice

↓

Review Progress

---

## Advanced Learner

Characteristics

- Completed most lessons
- Focused on refinement

Navigation Priority

Daily Practice

↓

Weak Areas

↓

Voice Improvement

↓

Progress

---

# 18. Session Types

Every interaction inside Itqān belongs to one of four session types.

---

## Learning Session

Purpose

Introduce new knowledge.

Examples

- New Qaida lesson
- New Tajweed lesson

Expected Duration

5–15 minutes

Outcome

New concept learned.

---

## Practice Session

Purpose

Strengthen existing knowledge.

Examples

- Pronunciation drills
- Rule revision
- Weak area practice

Expected Duration

5–20 minutes

Outcome

Improved mastery.

---

## Evaluation Session

Purpose

Measure current ability.

Examples

- Voice Matching
- AI Pronunciation Analysis
- Lesson Assessment

Expected Duration

2–10 minutes

Outcome

Feedback and insights.

---

## Review Session

Purpose

Refresh previously learned material.

Examples

- Previous lessons
- Incorrect answers
- AI recommended revision

Expected Duration

Flexible

Outcome

Long-term retention.

---

# 19. Entry Points

Users should be able to reach major systems from multiple locations without creating duplicate navigation.

## Voice Matching

Accessible From

- Onboarding
- Home
- Profile

---

## Qaida

Accessible From

- Learn
- Home (Continue Learning)

---

## Tajweed

Accessible From

- Learn
- Home (Continue Learning)

---

## Practice

Accessible From

- Home
- Learn (after lesson completion)
- Progress (recommended revision)

---

## Progress

Accessible From

- Home
- Navigation Bar

---

# 20. Exit Points

Every user journey should conclude with a meaningful next action.

Voice Match Complete

↓

Listen to Recommended Qari

or

Begin Learning

---

Lesson Complete

↓

Next Lesson

↓

Practice

↓

Return Home

---

Practice Complete

↓

View Progress

↓

Continue Practice

↓

Return Home

---

Assessment Complete

↓

Review Mistakes

↓

Retry

↓

Continue Learning

---

No workflow should terminate without offering a logical continuation.

---

# 21. Global Navigation Rules

The following rules apply across the entire application.

### Rule 1

Navigation should never interrupt learning.

---

### Rule 2

Learning sessions should minimize unnecessary page transitions.

---

### Rule 3

The learner should always understand:

- Where they are
- What they are doing
- What comes next

---

### Rule 4

The application should remember unfinished work and always offer the option to resume.

---

### Rule 5

Navigation should become simpler as users become more experienced.

Beginners receive more guidance.

Experienced learners receive quicker access to practice.

---

### Rule 6

Frequently repeated actions should become progressively easier to access.

Example

Continue Learning

↓

Continue Practice

↓

Retry Recording

---

# 22. Future Navigation Philosophy

As Itqān expands with future systems such as Hifz, Teacher Dashboard, Parent Dashboard, and Community features, the primary navigation should remain stable.

Rather than introducing additional top-level navigation destinations, new capabilities should integrate into the existing ecosystem through contextual entry points.

This ensures that the application's mental model remains consistent regardless of future growth.

The learner should never feel that the application has become larger.

Instead, the application should feel smarter.