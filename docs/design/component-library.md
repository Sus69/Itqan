# Component Library
## Reusable Experience Components

> Version: 1.0
> Status: Living Document
> Depends on:
> - design/design-system.md
> - architecture/screen-inventory.md
> - education/lesson-blueprint.md
>
> Purpose:
> Define every reusable experience component inside Itqān.
>
> Components are not pages.
>
> Components are reusable building blocks used to construct pages, lessons, assessments, and interactions.
>
> The objective is consistency, maintainability, and scalability.

---

# 1. Component Philosophy

Every component should have one responsibility.

Components should never be designed for one specific screen.

Instead, every component should be reusable across multiple experiences.

The interface should be assembled from reusable building blocks rather than unique page designs.

---

# 2. Component Naming Convention

Format

CMP-[CATEGORY]-XXX

Example

CMP-LRN-001

Meaning

Learning Component 001

Component IDs never change.

Component names may evolve.

---

# 3. Component Categories

| Prefix | Category |
|---------|----------|
| CMP-FND | Foundation |
| CMP-NAV | Navigation |
| CMP-LRN | Learning |
| CMP-AUD | Audio |
| CMP-PRC | Practice |
| CMP-FBK | Feedback |
| CMP-ASM | Assessment |
| CMP-PRG | Progress |
| CMP-UTL | Utility |

---

# 4. Standard Component Template

Every component follows this specification.

---

## Component ID

Example

CMP-LRN-001

---

### Name

Official component name.

---

### Purpose

Why the component exists.

---

### Used By

Where the component appears.

---

### Inputs

Information required by the component.

---

### Outputs

What the learner gains or what event is produced.

---

### States

Different interaction states.

---

### Future Expansion

Ideas reserved for future versions.

---

# FOUNDATION COMPONENTS

---

## CMP-FND-001

Page Container

Purpose

Defines the main content area for every screen.

---

## CMP-FND-002

Section Container

Purpose

Groups related information together.

---

## CMP-FND-003

Content Divider

Purpose

Separate unrelated content.

---

## CMP-FND-004

Section Header

Purpose

Introduce new sections.

---

## CMP-FND-005

Scrollable Content Area

Purpose

Display vertically scrollable educational content.

---

# NAVIGATION COMPONENTS

---

## CMP-NAV-001

Continue Learning Card

Purpose

Resume unfinished learning.

---

## CMP-NAV-002

Module Card

Purpose

Represent one learning module.

---

## CMP-NAV-003

Chapter Card

Purpose

Represent one chapter.

---

## CMP-NAV-004

Lesson Card

Purpose

Represent one lesson.

---

## CMP-NAV-005

Progress Indicator

Purpose

Display current completion progress.

---

## CMP-NAV-006

Bottom Navigation

Purpose

Navigate between primary product areas.

---

# LEARNING COMPONENTS

---

## CMP-LRN-001

Lesson Hero

Purpose

Introduce the lesson.

Contents

- Title
- Subtitle
- Learning Objective

---

## CMP-LRN-002

Learning Objective

Purpose

Explain what the learner will achieve.

---

## CMP-LRN-003

Concept Block

Purpose

Explain one concept only.

Never teach multiple concepts inside one Concept Block.

---

## CMP-LRN-004

Example Block

Purpose

Demonstrate the concept.

---

## CMP-LRN-005

Arabic Verse Display

Purpose

Display Quranic verses used during learning.

---

## CMP-LRN-006

Word Breakdown

Purpose

Explain individual words.

---

## CMP-LRN-007

Letter Breakdown

Purpose

Explain individual letters.

---

## CMP-LRN-008

Memory Tip

Purpose

Improve long-term retention.

---

## CMP-LRN-009

Reflection Prompt

Purpose

Encourage learner reflection.

---

## CMP-LRN-010

Lesson Summary

Purpose

Summarize key takeaways.

---

# AUDIO COMPONENTS

---

## CMP-AUD-001

Reference Audio Player

Purpose

Play expert recitation.

---

## CMP-AUD-002

Listen & Repeat

Purpose

Guide pronunciation practice.

---

## CMP-AUD-003

Recording Panel

Purpose

Capture learner audio.

---

## CMP-AUD-004

Playback Controls

Purpose

Replay recordings.

---

## CMP-AUD-005

Waveform Viewer

Purpose

Visualize recorded audio.

---

## CMP-AUD-006

Comparison Player

Purpose

Compare learner and reference recordings.

---

## CMP-AUD-007

Playback Speed

Purpose

Adjust playback speed.

---

## CMP-AUD-008

Loop Playback

Purpose

Repeat selected audio.

---

# PRACTICE COMPONENTS

---

## CMP-PRC-001

Practice Prompt

Purpose

Present practice instructions.

---

## CMP-PRC-002

Record Yourself

Purpose

Initiate learner recording.

---

## CMP-PRC-003

Retry Practice

Purpose

Allow another attempt.

---

## CMP-PRC-004

Hint Panel

Purpose

Provide optional guidance.

---

## CMP-PRC-005

Practice Counter

Purpose

Track attempts.

---

# FEEDBACK COMPONENTS

---

## CMP-FBK-001

Success Feedback

Purpose

Confirm correct performance.

---

## CMP-FBK-002

Mistake Highlight

Purpose

Identify exactly where the mistake occurred.

---

## CMP-FBK-003

Correction Card

Purpose

Explain how to fix the mistake.

---

## CMP-FBK-004

Rule Reminder

Purpose

Remind learners of the relevant rule.

---

## CMP-FBK-005

Performance Summary

Purpose

Summarize strengths and weaknesses.

---

# ASSESSMENT COMPONENTS

---

## CMP-ASM-001

Multiple Choice

Purpose

Assess conceptual understanding.

---

## CMP-ASM-002

Listening Question

Purpose

Assess listening accuracy.

---

## CMP-ASM-003

Recording Question

Purpose

Assess pronunciation.

---

## CMP-ASM-004

Matching Exercise

Purpose

Assess recognition.

---

## CMP-ASM-005

Assessment Summary

Purpose

Display assessment results.

---

# PROGRESS COMPONENTS

---

## CMP-PRG-001

Lesson Progress

Purpose

Display lesson completion.

---

## CMP-PRG-002

Module Progress

Purpose

Display module completion.

---

## CMP-PRG-003

Learning Streak

Purpose

Track learning consistency.

---

## CMP-PRG-004

Achievement Card

Purpose

Celebrate milestones.

---

## CMP-PRG-005

Learning Statistics

Purpose

Summarize learner activity.

---

# UTILITY COMPONENTS

---

## CMP-UTL-001

Dialog

Purpose

Display confirmation requests.

---

## CMP-UTL-002

Bottom Sheet

Purpose

Display contextual actions.

---

## CMP-UTL-003

Toast

Purpose

Display temporary notifications.

---

## CMP-UTL-004

Tooltip

Purpose

Provide contextual help.

---

## CMP-UTL-005

Loading State

Purpose

Communicate ongoing processing.

---

## CMP-UTL-006

Skeleton Loader

Purpose

Improve perceived loading performance.

---

## CMP-UTL-007

Empty State

Purpose

Handle absence of content.

---

## CMP-UTL-008

Error State

Purpose

Communicate recoverable errors.

---

# Component Rules

Every component should:

- Have one responsibility.
- Be reusable.
- Behave consistently.
- Support accessibility.
- Remain independent of visual themes.
- Be composable with other components.

No component should contain business logic.

Components communicate.

Screens orchestrate.

The learning engine decides behaviour.

---

# Guiding Principle

Every screen inside Itqān should be built by assembling reusable components rather than designing unique layouts.

Consistency creates familiarity.

Familiarity reduces cognitive load.

Reduced cognitive load allows learners to focus on what truly matters:

Learning, reciting, and improving.