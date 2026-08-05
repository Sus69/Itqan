# Product Ecosystem
## Itqān Product Architecture

> Version: 1.0
> Status: Foundational Document
> Depends on: vision/vision.md
> Purpose: Defines every major system that exists inside Itqān, how those systems relate to one another, and the complete product ecosystem. This document describes **what exists**, not **how it is implemented**.

---

# 1. Introduction

Itqān is not a single-purpose application.

It is a complete ecosystem designed to support the entire Quran recitation journey—from learning the Arabic alphabet to developing beautiful, confident recitation.

Rather than separating learning into disconnected applications, Itqān combines multiple educational systems under one unified experience.

Each system solves a different stage of the learner's journey while remaining connected through shared progress and AI guidance.

---

# 2. Product Ecosystem Overview

The product consists of three primary pillars supported by several core systems.

```

```
                    ITQĀN

      ┌──────────────┼──────────────┐

 Voice Matching    Qaida        Tajweed

      └──────────────┼──────────────┘

            Shared Core Systems

        AI Teacher
        Practice
        Progress
        Audio Engine
        User Profile
```

```md

Every feature inside the application belongs to one of these systems.

---

# 3. Primary Product Pillars

## 3.1 Voice Matching

### Purpose

Help users discover a professional Qari whose vocal characteristics naturally resemble their own voice.

The objective is not imitation.

The objective is to provide learners with a suitable reference that feels natural for continuous learning.

### Responsibilities

- Record user recitation.
- Analyze vocal characteristics.
- Compare against supported Qari database.
- Recommend the closest matching Qari.
- Provide access to reference recitations.
- Allow users to revisit comparisons in the future.

### User Outcome

"I now know which Qari is the best reference for my natural voice."

---

## 3.2 Qaida

### Purpose

Teach complete beginners how to read Arabic correctly.

Qaida is the entry point for users with little or no Arabic reading ability.

### Responsibilities

- Teach Arabic letters.
- Teach pronunciation.
- Teach joining letters.
- Teach vowels.
- Teach reading fluency.
- Build confidence before Tajweed.

### Completion Criteria

A learner who completes Qaida should be capable of independently reading Quranic Arabic.

Completion does not remove Qaida from the application.

Users may always return for revision and additional practice.

---

## 3.3 Tajweed

### Purpose

Teach authentic Quran recitation according to the principles of Tajweed.

Unlike traditional books, Tajweed inside Itqān is highly interactive.

Every lesson combines explanation, listening, speaking, recording, AI evaluation, correction, and repetition.

### Responsibilities

- Teach Tajweed concepts.
- Explain rules.
- Demonstrate correct pronunciation.
- Provide guided practice.
- Evaluate recordings.
- Identify mistakes.
- Explain corrections.
- Build mastery.

Completion of all lessons transitions the learner into continuous practice rather than ending their journey.

---

# 4. Core Systems

These systems support every primary pillar.

---

## 4.1 Learning System

Responsible for delivering structured educational content.

Supports:

- Qaida
- Tajweed

Responsibilities:

- Modules
- Chapters
- Lessons
- Learning progression
- Revision

---

## 4.2 Practice System

Learning introduces concepts.

Practice develops mastery.

The Practice System allows learners to strengthen existing skills independently of lessons.

Practice may include:

- Letter practice
- Rule practice
- Pronunciation drills
- Recording exercises
- Weak-area practice
- Revision sessions
- AI-guided repetition

Practice remains available even after all lessons are completed.

---

## 4.3 AI Teacher

The AI Teacher exists throughout the learning journey.

Responsibilities include:

- Explaining mistakes
- Highlighting pronunciation errors
- Guiding corrections
- Providing contextual explanations
- Encouraging improvement
- Adapting explanations to learner progress

The AI acts as a tutor rather than an examiner.

Its purpose is guidance, not grading.

---

## 4.4 Audio Engine

The Audio Engine powers every voice-based interaction.

Responsibilities include:

- Audio recording
- Playback
- Reference recitation
- AI pronunciation analysis
- Voice comparison
- Audio visualization

This system is shared across Voice Matching, Qaida, and Tajweed.

---

## 4.5 Progress System

Responsible for measuring learning progress.

Tracks:

- Lesson completion
- Practice activity
- Learning history
- Mastery
- Improvement
- Voice development
- Future pronunciation metrics

The goal is to show meaningful improvement rather than simple completion percentages.

---

## 4.6 User Profile

Stores user-specific learning information.

Includes:

- Learning preferences
- Selected reference Qari
- Learning history
- Progress
- Practice history
- Settings

---

# 5. User Journeys

The ecosystem supports multiple entry points.

## Journey A

Discover Your Voice

```

```
Open App

↓

Record

↓

Voice Analysis

↓

Reference Qari

↓

Reference Listening

↓

Practice
```

```md

---

## Journey B

Learn Arabic

```

```
Open App

↓

Qaida

↓

Lessons

↓

Practice

↓

Reading Fluency

↓

Complete
```

```md

---

## Journey C

Improve Tajweed

```

```
Open App

↓

Choose Lesson

↓

Learn Rule

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

Master

↓

Next Lesson
```

```md

---

## Journey D

Daily Improvement

```

```
Open App

↓

Continue Learning

↓

Practice

↓

AI Feedback

↓

Progress Updated

↓

Close
```

```md

---

# 6. Relationships Between Systems

The three primary pillars are independent but interconnected.

Voice Matching enhances Tajweed by providing a personalized reference Qari.

Qaida prepares learners for Tajweed.

Tajweed improves pronunciation and confidence.

Practice reinforces both Qaida and Tajweed.

Progress combines achievements across every learning activity.

The AI Teacher exists across the entire ecosystem.

---

# 7. Product Boundaries

Itqān intentionally focuses on Quran recitation.

It does not attempt to become:

- a Quran streaming service
- an Islamic encyclopedia
- a social network
- a fatwa platform
- a digital Mushaf replacement

Future features should strengthen the existing learning journey rather than expanding into unrelated domains.

---

# 8. Future Expansion

The architecture intentionally allows future systems without major redesign.

Potential additions include:

- Hifz (Memorization)
- Teacher Dashboard
- Parent Dashboard
- Classroom Management
- Offline Learning
- Advanced Voice Analytics
- Multiple Recitation Riwayat
- Community Challenges
- Certification

These should integrate into the existing ecosystem rather than replacing current systems.

---

# 9. Design Philosophy

Every feature inside Itqān should answer one of three questions.

Can the learner discover?

Can the learner learn?

Can the learner improve?

If a feature does not contribute to one of these objectives, it does not belong inside the product.

The ecosystem should remain focused, coherent, and centered around helping users become confident, accurate, and beautiful reciters of the Qur'an.