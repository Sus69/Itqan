# Screen Inventory
## Itqān Screen Registry

> Version: 1.0
> Status: Living Document
> Depends on:
> - vision/vision.md
> - architecture/product-ecosystem.md
> - architecture/navigation.md
>
> Purpose:
> Maintain a complete registry of every screen, state, modal, overlay, dialog, loading state, and error state that exists within Itqān.
>
> This document acts as the single source of truth for product design, UI/UX, frontend development, and QA.
>
> Every screen inside the application must appear in this document before implementation.

---

# Screen ID Convention

Each screen receives a permanent identifier.

Format

PREFIX-NUMBER

Example

HOM-001

Meaning

Home Screen

The identifier never changes.

Screen names may evolve.

IDs never do.

---

# Prefix Registry

| Prefix | Category |
|---------|----------|
| GLB | Global |
| ONB | Onboarding |
| HOM | Home |
| LRN | Learn |
| QAD | Qaida |
| TAJ | Tajweed |
| PRC | Practice |
| VMT | Voice Matching |
| PRG | Progress |
| PRO | Profile |
| MOD | Modal |
| DIA | Dialog |
| OVL | Overlay |
| EMP | Empty State |
| ERR | Error State |
| LOD | Loading State |

---

# Screen Template

Every screen follows this specification.

## Screen ID

Example

HOM-001

---

### Name

Official screen name.

---

### Purpose

Why this screen exists.

---

### Entry Points

Where users arrive from.

---

### Exit Points

Where users can navigate next.

---

### Primary Action

The main action the screen encourages.

---

### Secondary Actions

Optional actions.

---

### User States

Different variations of this screen.

---

### Components

Reusable UI components used.

---

### Dependencies

Systems or services required.

---

### Future Enhancements

Ideas intentionally postponed.

---

# GLOBAL SCREENS

---

## GLB-001

### Splash Screen

Purpose

Initial application loading screen.

Entry

Application Launch

Exit

Authentication

Home

States

• Cold Start

• Warm Start

• Offline

---

## GLB-002

### Authentication

Purpose

Authenticate user identity.

States

• Login

• Signup

• Forgot Password

• Guest Mode (Future)

---

## GLB-003

### Update Required

Purpose

Notify users that the application requires updating.

---

## GLB-004

### Maintenance Mode

Purpose

Inform users that servers are temporarily unavailable.

---

# ONBOARDING

---

## ONB-001

Welcome

---

## ONB-002

Introduction

---

## ONB-003

Permissions

Microphone

Notifications

Storage (Future)

---

## ONB-004

Voice Match Introduction

---

## ONB-005

First Voice Recording

---

## ONB-006

Voice Processing

---

## ONB-007

Voice Match Result

---

## ONB-008

Choose Learning Path

Qaida

Tajweed

Explore

---

## ONB-009

Onboarding Complete

---

# HOME

---

## HOM-001

Home Dashboard

States

• First Visit

• Returning User

• Continue Learning

• Daily Goal Complete

• Voice Match Pending

• Offline

---

## HOM-002

Continue Learning

---

## HOM-003

Today's Recommendation

---

## HOM-004

Daily Progress

---

## HOM-005

Achievements Preview

---

# LEARN

---

## LRN-001

Learning Hub

---

## LRN-002

Course Selection

---

## LRN-003

Continue Course

---

# QAIDA

---

## QAD-001

Qaida Home

---

## QAD-002

Module Overview

---

## QAD-003

Chapter Overview

---

## QAD-004

Lesson Overview

---

## QAD-005

Lesson Player

---

## QAD-006

Lesson Complete

---

## QAD-007

Revision

---

## QAD-008

Assessment

---

## QAD-009

Course Complete

---

# TAJWEED

---

## TAJ-001

Tajweed Home

---

## TAJ-002

Module Overview

---

## TAJ-003

Chapter Overview

---

## TAJ-004

Lesson Overview

---

## TAJ-005

Lesson Player

---

## TAJ-006

Guided Listening

---

## TAJ-007

Recording

---

## TAJ-008

AI Evaluation

---

## TAJ-009

Mistake Breakdown

---

## TAJ-010

Retry Recording

---

## TAJ-011

Lesson Summary

---

## TAJ-012

Lesson Complete

---

## TAJ-013

Revision

---

## TAJ-014

Assessment

---

## TAJ-015

Course Complete

---

# PRACTICE

---

## PRC-001

Practice Hub

---

## PRC-002

Weak Areas

---

## PRC-003

Daily Practice

---

## PRC-004

Rule Practice

---

## PRC-005

Letter Practice

---

## PRC-006

Recording Practice

---

## PRC-007

AI Feedback

---

## PRC-008

Practice Complete

---

# VOICE MATCH

---

## VMT-001

Voice Match Home

---

## VMT-002

Recording

---

## VMT-003

Processing

---

## VMT-004

Results

---

## VMT-005

Reference Qari

---

## VMT-006

Compare Again

---

## VMT-007

History (Future)

---

# PROGRESS

---

## PRG-001

Progress Dashboard

---

## PRG-002

Learning Analytics

---

## PRG-003

Practice History

---

## PRG-004

Achievements

---

## PRG-005

Streak

---

## PRG-006

Future Voice Analytics

---

# PROFILE

---

## PRO-001

Profile

---

## PRO-002

Reference Qari

---

## PRO-003

Settings

---

## PRO-004

Learning Preferences

---

## PRO-005

Accessibility

---

## PRO-006

About

---

# SHARED DIALOGS

(To Be Expanded)

MOD-001

Confirmation

MOD-002

Delete

MOD-003

Exit Lesson

...

---

# EMPTY STATES

(To Be Expanded)

EMP-001

No Progress

EMP-002

No Internet

EMP-003

No Practice History

...

---

# LOADING STATES

(To Be Expanded)

LOD-001

Voice Processing

LOD-002

AI Evaluation

LOD-003

Loading Lesson

...

---

# ERROR STATES

(To Be Expanded)

ERR-001

Recording Failed

ERR-002

Network Error

ERR-003

AI Service Unavailable

...

---

# Development Status

Every screen should eventually receive one of the following statuses.

- Planned
- UX Designed
- UI Designed
- Prototype Complete
- Frontend Complete
- Backend Connected
- QA Complete
- Released

This section will evolve throughout development.