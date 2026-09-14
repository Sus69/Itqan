# Itqan product redesign direction

**Status:** approved design direction for implementation  
**Scope:** product IA, navigation, learning sessions, feedback, states, responsive behaviour, and visual system.

## 1. Current product model

Itqan is a Quran-recitation learning companion with three instructional pillars:

1. **Qaida** — 22 locally persisted Arabic-reading lessons, each with a letter/word grid, pronunciation audio, an optional recording, a quiz, and manual completion.
2. **Tajweed course** — 19 sequential chapters across six tiers. A chapter has Theory and Practice tabs; practice asks the learner to record an extract, sends it to the Tajweed evaluator, and unlocks the next chapter once required extracts pass.
3. **Voice matching** — a 30–60-second recorded/uploaded sample is compared with 242 Qari profiles. The learner selects one result as a reference voice.

These pillars are supported by a standalone Tajweed Studio (choose one of 20 verses, record, get rule evaluations), an articulation atlas, a progress dashboard, profile/authentication, and a desktop sidebar/mobile bottom navigation.

### Existing navigation and routes

```
Home (/)
├── Learn (/learn)
│   ├── Qaida (/qaida; /qaida/lesson/:id; /qaida/makharij)
│   └── Tajweed (/learn/tajweed; /learn/tajweed/lesson/:chapterId; /learn/tajweed/reference)
├── Practice (/practice)
│   ├── Tajweed Studio (/practice/tajweed)
│   └── Voice Matcher (/practice/voice-match)
├── Progress (/progress)
└── Profile (/profile)
```

### Current user journeys

| Journey | Actual flow | Current outcome |
|---|---|---|
| New/guest | Home → sign in/demo or browse features | No guided onboarding, learning-path choice, or explicit microphone preparation. |
| Qaida learner | Learn → Qaida roadmap → lesson → click/listen/quiz → manually complete | Progress is stored locally; lesson completion is possible without a proven practice attempt. |
| Tajweed learner | Learn → course → chapter theory → practice extract → record → AI result → retry/complete | The course has a real sequential gate and completion modal. |
| Free practice | Practice → Studio → pick verse → record → AI result → choose another verse | Choice comes before purpose; feedback is not converted into a focused follow-up drill. |
| Voice setup | Practice/Profile/Home → Voice Match → record/upload → select a Qari → “Saved” | The selected Qari is visually saved but not persisted to profile/backend. |
| Reflection | Progress → aggregate cards/logs | Guest figures mix placeholder values with real values and do not lead to a next action. |

### States implemented today

- Audio: idle, microphone-ready, recording, recorded/playback, browser unsupported, permission denied/no microphone, busy/processing.
- AI: result, insufficient-speech retry message, and transport/backend error message.
- Course: active, locked, theory complete, extract passed, chapter completed.
- Qaida: active/completed tile and lesson states plus quiz result; local persistence only.
- Account: guest, credential login/registration failure, demo fallback, signed in, profile save success.
- Empty state: only progress history has a dedicated empty state. There are no content skeletons, app-level offline/maintenance screens, or a unified unavailable-AI recovery.

### Current visual/system observations (not judgments of aesthetic taste)

- The product already has a calm emerald/gold/sand palette, shared card/button primitives, Arabic/Quran font roles, visible focus styling, and a desktop/mobile navigation adaptation.
- Page patterns vary substantially: feature hub cards, dense course catalogues, full-screen lesson experiences, and studio-like two-column layouts use different hierarchy and terminology.
- Multiple names describe the same learning activity: *Tajweed Studio*, *AI Recitation Test*, *Practice Verses*, and *Recording Practice*. The user must infer when to learn versus when to evaluate.
- Product documentation describes onboarding, a daily recommendation, weak-area practice, progress-driven guidance, and reference-reciter listening. Those connections are not yet realized in the UI/data flow.

## 2. Research principles applied

The redesign borrows patterns rather than copying another product:

- **Progressive disclosure:** expose one recommended action and the minimum supporting context; place catalogue, rule detail, and advanced choices one level deeper. This keeps an audio-learning task from becoming a navigation task. [Progressive Disclosure](https://quality.arc42.org/approaches/progressive-disclosure)
- **Practice loop instead of score reporting:** feedback must identify the exact next repair action, allow an immediate retry, and later surface a focused review. Tarteel’s published feature set similarly combines recitation feedback, recordings/mistakes, goals, and history rather than treating analysis as an isolated result. [Tarteel features](https://support.tarteel.ai/en/collections/15105266-tarteel-features)
- **Audio-first preparation:** articulate target, expected duration, privacy/permission need, and what happens after recording before the permission request. Maintain a clear, cancellable processing status and a specific recovery action.
- **Accessible and predictable controls:** keyboard-visible focus, non-colour status signals, adequately sized touch targets, reduced motion, semantic RTL treatment, and consistently placed help/retry. WCAG 2.2 specifically strengthens focus visibility, target-size, predictable help, and accessible authentication. [W3C WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/)

## 3. Decision matrix

| Current experience | Problem | Insight | Proposed experience |
|---|---|---|---|
| Home presents a fixed Studio card, a Qari card, metrics, and pillars | “Continue” is not derived from learner state and the next decision is still ambiguous | The first screen should reduce choice | **Today** shows one state-aware next session plus one secondary option; exploration moves to Learn/Practice. |
| Learn also lists 20 practice verses | Structured learning and open practice compete in the same place | Mode should be clear before content selection | Learn owns paths and lessons; Practice owns targeted/open drills. |
| Studio opens with a dense verse picker beside recording | The learner chooses a verse before understanding a goal | Start with task intent; reveal the catalogue on request | Practice starts with a recommendation/intent, then target selection, then a focused record-and-feedback session. |
| AI results are scores and expandable rule cards | The learner is left to translate diagnosis into an action | Feedback should close the loop | Results lead with one priority correction, a listen/see cue, retry, then secondary rule detail. |
| Voice Match is accessible as a persistent feature | It interrupts the main learning path and does not truly save the selection | Personalisation should be optional, durable, and contextual | Short setup is offered during onboarding or Profile; saving updates the account/local profile and links to reference listening. |
| Progress shows percentages, placeholder category values, and a history | Reflection does not drive action or distinguish data confidence | Progress needs meaning and an action | Insights presents a reliable activity summary, skill map, recent feedback, and “practice this next.” |
| Guest, backend-offline, and AI-unavailable states appear in each page differently | Trust and recovery are inconsistent | System status must be clear and local to the action | Shared session-status, retry, empty, and service-unavailable components with non-destructive recovery. |

## 4. New information architecture

The primary navigation follows learner goals, not implementation features:

```
Today                 the recommended next session
Learn                 the two structured paths: Qaida and Tajweed
Practice              targeted review, open verse practice, articulation drills
Insights              progress, recent feedback, skill map, achievements
Profile               account, goals, preferences, reference Qari, accessibility
```

Voice Match and the articulation/reference guides are supporting experiences, not primary destinations. They appear as contextual links from onboarding, Profile, course lessons, and a relevant practice recommendation.

### Key screen hierarchy

```
Today
└── Recommended session → Learning / Practice session → Feedback → Next step

Learn
├── Path overview (Qaida | Tajweed)
├── Course roadmap
└── Lesson session
    ├── Prepare
    ├── Learn
    ├── Guided practice
    ├── Record & receive feedback
    └── Summary / next lesson

Practice
├── Recommended review (weakest/recent skill)
├── Open practice target picker
└── Session feedback / retry

Insights
├── Activity and goal
├── Skill map
└── Recitation history → individual feedback
```

## 5. Interaction model

### First run / onboarding

1. Welcome and establish the learner’s goal: “I am learning to read”, “I want to learn Tajweed”, or “I want to improve my recitation”.
2. Explain the recommended first session; offer voice matching as optional personalisation, not a prerequisite.
3. Request microphone permission only when the learner chooses their first audio activity, explaining why it is needed.
4. Land on Today with a specific, reversible next action.

### Learning session

Every Qaida and Tajweed lesson uses the same visible progression: **Learn → Try with guidance → Record → Feedback → Continue**. A compact session rail shows the current stage and lets learners revisit earlier material without implying completion. Theory is chunked by one objective; reference audio and terminology controls live next to the relevant example, not in a global control cluster.

### Recording and feedback

Before recording, show the target, the single skill in focus, duration guidance, and a “hear it first” option. While processing, name the stage in learner language and retain the target on screen. After analysis, show:

1. a supportive outcome;
2. one priority correction with location, reason, and corrective cue;
3. a prominent retry with the same target;
4. detailed rule results as optional disclosure;
5. a clear next action: continue, practice that rule, or choose another target.

### Responsive and accessibility requirements

- Mobile keeps the same sequence; only the catalog/secondary information becomes a sheet or collapsible panel.
- Arabic text is directionally isolated and uses reading-appropriate line height/size. Interface chrome remains selectable English/Arabic rather than mixed by default.
- Record, stop, retry, and next controls have named accessible labels, keyboard focus, non-colour state labels, and at least WCAG 2.2 AA target/focus treatment.
- Never auto-play audio; provide playback speed, replay/loop, caption/transliteration preferences, reduced motion, and an accessible no-microphone path.

## 6. Design system requirements

Build the UI from reusable, purpose-based primitives:

- **Foundation:** app frame, content width, surface hierarchy, typography and space tokens.
- **Navigation:** primary nav, page/context header, breadcrumbs, lesson-step rail, continue card.
- **Learning:** objective block, concept/explanation, Arabic target, reference player, guided cue, lesson summary.
- **Audio:** recording readiness, recorder, processing status, playback/loop control, comparison cue.
- **Feedback:** outcome summary, priority correction, rule detail, retry prompt, completion panel.
- **State:** skeleton, empty, service unavailable, microphone-permission, and recoverable error.

The visual language stays calm and respectful, but uses less decorative card repetition, stronger content grouping, and a semantic token layer so light/dark/high-contrast themes can be added without rewriting component behaviour.

## 7. Implementation order

1. Establish the semantic UI primitives/tokens and goal-led navigation.
2. Add first-run goal selection and a state-aware Today dashboard.
3. Separate Learn and Practice responsibilities; make each hub recommend one action.
4. Reframe the audio session and feedback sequence across Tajweed Studio, course lessons, Qaida, and Voice Match.
5. Rebuild Insights/Profile around durable data and clear settings.
6. Validate desktop/mobile paths, empty/error/permission states, keyboard interaction, and build output.

## 8. Acceptance criteria

- A new learner can choose a path and reach the first meaningful activity without interpreting a feature catalogue.
- At every lesson/practice result, there is one obvious next action.
- Voice, course, Qaida, Studio, progress, and profile use the same vocabulary and session states.
- No UI claims that an action saved/completed when it only changed local visual state.
- All primary screens work at narrow and wide breakpoints, with a visible focus path and non-colour feedback.
