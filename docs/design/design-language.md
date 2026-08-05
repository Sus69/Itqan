# Design System
## Design Language & Experience Principles

> Version: 1.0
> Status: Foundational Document
> Depends on:
> - vision/vision.md
> - architecture/navigation.md
> - architecture/screen-inventory.md
> - education/lesson-blueprint.md
>
> Purpose:
> Define the universal visual and interaction principles that govern every interface inside Itqān.
>
> This document intentionally avoids specifying colors, fonts, spacing values, border radii, or implementation-specific styling.
>
> Those belong to themes.
>
> This document defines the design language that remains constant regardless of visual identity.

---

# 1. Design Philosophy

The interface should disappear behind the learning experience.

Users should never admire the interface more than they admire their own progress.

The UI exists to remove friction between intention and learning.

Every design decision should reduce cognitive effort rather than increase visual excitement.

---

# 2. Core Experience Principles

Every screen should feel:

• Calm

• Focused

• Respectful

• Intentional

• Predictable

The interface should never feel:

• Busy

• Overwhelming

• Noisy

• Competitive

• Distracting

---

# 3. Information Hierarchy

Every screen should answer one primary question.

Examples

"What am I learning?"

"What should I do next?"

"What mistake did I make?"

"What improved?"

Avoid presenting multiple equally important pieces of information.

Users should never wonder where to look first.

---

# 4. Progressive Disclosure

Show information only when it becomes useful.

Do not expose advanced controls before they are needed.

Learning should unfold naturally.

Examples

Beginner

↓

Simple explanation

↓

Practice

↓

Feedback

↓

Advanced explanation (optional)

Never overwhelm beginners with expert-level information.

---

# 5. Visual Hierarchy

Every screen should have:

One Primary Focus

One Primary Action

Supporting Information

Nothing should visually compete with the primary objective.

Hierarchy should be communicated through layout before styling.

---

# 6. Layout Principles

Interfaces should be structured around logical sections rather than decorative containers.

Related information should remain visually grouped.

Unrelated information should remain visually separated.

Whitespace is a communication tool.

Spacing communicates relationships before text does.

---

# 7. Content Density

Learning interfaces should prioritize breathing room over information density.

Large amounts of information should be divided into smaller, digestible sections.

One concept per section.

One objective per interaction.

---

# 8. Interaction Philosophy

Every interaction should produce a meaningful outcome.

Avoid interactions that exist only for visual appeal.

Examples

Good

Listen

Record

Retry

Reveal

Compare

Practice

Reflect

Poor

Unnecessary clicks

Decorative confirmations

Animations without purpose

---

# 9. Primary Actions

Every screen should expose one clearly dominant action.

Examples

Continue

Start Lesson

Record

Retry

Finish

Secondary actions should never compete with the primary action.

---

# 10. Feedback

Every user action deserves an understandable response.

The system should always communicate:

What happened.

Why it happened.

What happens next.

Feedback should never leave the learner uncertain.

---

# 11. Motion Principles

Motion exists to explain change.

Never decorate.

Animations should communicate:

Transition

Progress

Completion

Attention

State changes

If motion does not improve understanding, it should not exist.

---

# 12. Learning First

The interface should always prioritize learning over navigation.

Reading

↓

Listening

↓

Speaking

↓

Feedback

↓

Retry

The learner should spend significantly more time interacting with educational content than navigating menus.

---

# 13. Navigation Consistency

Navigation should remain predictable throughout the application.

The same action should always behave the same way.

Users should build confidence through familiarity.

---

# 14. Error Prevention

Prevent mistakes before explaining them.

Examples

Disable impossible actions.

Explain requirements beforehand.

Guide the learner toward success.

Recovery should always be easier than failure.

---

# 15. Accessibility

Accessibility is not an optional feature.

The design should support:

• Keyboard navigation

• RTL layouts

• Screen readers

• High contrast themes

• Variable text scaling

• Reduced motion preferences

• Audio-first interaction

The experience should remain usable regardless of visual theme.

---

# 16. Responsive Behaviour

The learning experience should adapt naturally across devices.

Layouts may change.

Interactions may adapt.

Learning flow should never change.

A lesson should feel like the same lesson regardless of screen size.

---

# 17. RTL Principles

Arabic content is first-class content.

RTL support is part of the design process—not an afterthought.

Mixed-language layouts should remain readable and balanced.

---

# 18. Semantic Styling

Visual styling should communicate meaning rather than appearance.

The system should define semantic roles instead of fixed colors.

Examples

Primary

Secondary

Success

Warning

Error

Information

Neutral

Themes decide how these roles are visually represented.

---

# 19. Typography Roles

Typography should communicate hierarchy rather than decoration.

The system defines roles—not fonts.

Examples

Display

Heading

Section Title

Body

Caption

Label

Arabic Heading

Arabic Quran Text

Metric

Status

Actual font families are implementation decisions.

---

# 20. Surface Hierarchy

The interface should distinguish information by importance rather than decoration.

Possible surface roles include:

Primary Surface

Secondary Surface

Floating Surface

Interactive Surface

Temporary Surface

The visual representation of these surfaces depends on the active theme.

---

# 21. Components

Every reusable component should follow the same principles.

It should:

Have one clear purpose.

Behave consistently.

Support accessibility.

Communicate its state clearly.

Adapt to different themes without changing behavior.

---

# 22. Design for Growth

Every screen should accommodate future functionality without requiring complete redesign.

The interface should scale by extending existing patterns rather than introducing new ones.

Consistency is preferred over novelty.

---

# 23. Theme Independence

This design system intentionally avoids defining:

• Colors

• Font Families

• Shadows

• Border Radius

• Spacing Values

• Animations Timing

• Icon Style

These belong to individual themes.

The design language remains unchanged regardless of visual identity.

---

# 24. Guiding Principle

The learner should never think about the interface.

They should think about:

The Qur'an.

Their recitation.

Their improvement.

If the interface succeeds, it becomes invisible.

Every interaction should quietly guide the learner toward becoming a more confident and accurate reciter without demanding unnecessary attention.