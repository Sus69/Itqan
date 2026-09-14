# High-Density UX & Complete User Flow Overhaul Prompt for Itqān

> **Instructions for the AI/Engineer**: 
> Act as a **Principal Product Designer & Lead Frontend Architect**. You are tasked with conducting a full-scale UX audit, redesigning the end-to-end user journeys, and implementing a cohesive, distraction-free user flow for the **Itqān** platform.
> 
> You have full autonomy to determine the ideal Information Architecture (IA), routing topology, interaction states, and screen transitions based on first principles, usability heuristics, and domain constraints. Do not preserve awkward legacy flows out of habit; optimize strictly for learning efficacy, calm aesthetics, and frictionless task completion.

---

## 1. System & Domain Context

- **Platform Name**: Itqān (إتقان) — Real-Time Quranic Recitation & Tajweed Learning Platform
- **Core Technology Stack**:
  - **Frontend**: React 18, TypeScript, React Router DOM, Vite, Lucide Icons, Web Audio API / AudioWorklet
  - **Backend**: FastAPI (Python), PyTorch Audio Pipeline, VAD (Voice Activity Detection), Tajweed Rules Engine
  - **Typography & Script**: Arabic Uthmani / Amiri script alongside high-legibility Latin UI fonts (Inter/Outfit)
- **Current Modules & Surface Area**:
  1. **Foundations / Qaida Module**: Letter recognition, Harakaat, Tanween, Sukoon, Shaddah, interactive letter & word grid drills (`/learn/qaida`, `/qaida/lesson/:id`).
  2. **Makhaarij Explorer**: Interactive anatomical articulation points (Throat, Tongue, Lips, Nasal cavity, Empty mouth cavity) with audio models (`/qaida/makharij`).
  3. **Tajweed Mastery Course**: Progressive chapters (Makharij, Sifaat, Nun Sakinah, Meem Sakinah, Madd, Waqf, etc.) with theoretical guides and audio tests (`/learn/tajweed`, `/learn/tajweed/lesson/:id`).
  4. **AI Practice & VoiceMatch**: Real-time acoustic pitch/formant matching against reference Qaris (`/practice/voice-match`).
  5. **Tajweed Studio**: Freeform or targeted verse recitation with real-time VAD recording, phoneme-level error detection, and color-coded feedback (`/practice/tajweed`).
  6. **Progress & Analytics**: Heatmaps, accuracy trends, mastery matrix, mistake review bank, streak tracking (`/progress`, `/profile`).

---

## 2. Core Experience Principles & North Star

Adhere strictly to Itqān's design philosophy:
- **"The interface must disappear behind the sacred learning experience."**
- **Calm, Focused & Respectful**: Avoid dopamine-slot-machine gamification, visual noise, or flashy distractions. The feeling should resemble a focused digital sanctuary.
- **Predictable & Frictionless**: Zero ambiguity on what to do next, how to record, how to hear reference audio, or how to retry.
- **Progressive Disclosure**: Deliver simple, immediate primary actions with deep phonetic/rule details accessible on demand without cluttering the main viewport.

---

## 3. Execution Mandates (Phased Protocol)

### Phase 1: Comprehensive UX & Flow Friction Audit
Analyze the entire repository (`itqan-web/src/pages`, `components`, `App.tsx`) and document:
1. **Journey Disconnects & Dead Ends**:
   - Identify broken navigation loops (e.g., finishing a lesson vs returning to hub vs continuing to next lesson).
   - Evaluate redundant routes (`/qaida` vs `/learn/qaida`, `/tajweed` vs `/learn/tajweed`).
2. **Cognitive Load & Screen Density**:
   - Detect pages with excessive competing calls-to-action or cluttered controls.
   - Audit Arabic script legibility, diacritic clearance, and RTL layout harmony.
3. **State Observability & Audio Pipeline Feedback**:
   - Audit state communication during microphone authorization, audio streaming, model inference latency, and error states (mic blocked, silence detected, background noise).
4. **Information Architecture (IA) Matrix**:
   - Map out current vs proposed routing structure and navigation hierarchy (Global Navigation Bar, Top Bar, Floating Controls, Hubs).

---

### Phase 2: Flow Architecture & Journey Blueprinting
Design the comprehensive state machines and user journey transitions for:

1. **First-Time User Experience (FTUX) & Onboarding**:
   - Path from arrival to intent selection (Complete Beginner vs Rule Polisher vs Hafiz/Free Recitation).
   - Mic permission check with graceful fallback and calibration.
2. **The Core Learning Loop (Qaida & Tajweed Lessons)**:
   - *Learn / Listen* (Hear pristine reference Qari) -> *Engage / Inspect* (Anatomy & rule breakdown) -> *Record / Speak* (VAD-assisted recording) -> *Instant Feedback* (Color-coded phoneme breakdown) -> *Progress / Remediation* (Retry or Advance).
3. **The Studio & Free Recitation Loop**:
   - Surah/Ayah picker -> Continuous vs Ayah-by-Ayah mode -> Visual waveform/pitch feedback -> Detailed rule diagnostics panel.
4. **Mastery & Retention Loop**:
   - Post-session performance recap -> Mistake Bank (spotted phonemes saved for quick practice) -> Return to hub with updated mastery status.
5. **Edge Cases & Degradation Flows**:
   - Offline handling, microphone disconnected/denied, noisy environment alerts, backend disconnection fallback.

---

### Phase 3: Interaction Standards & Design System Harmony
Establish and apply consistent interaction patterns across all components:
- **Spatial Rhythm**: 8pt grid system, consistent container max-widths, unified modal and drawer layouts.
- **Audio Control Affordances**: Standardized audio playback buttons (Play, Pause, Slow 0.75x, Repeat loop), unified recording buttons with live pulse/waveform indicators.
- **Arabic Typography Scale**: Proper line-height (leading) for Tashkeel/diacritics, minimum font size for Quranic text, Uthmani font fallback stacks.
- **Micro-Interactions & Transitions**: Subtle page transitions, skeleton loaders for async data, clear focus/active states, accessible contrast ratios (WCAG AA compliance).

---

### Phase 4: Deliverables & Implementation Output

Provide the response in the following structured format:

#### 1. UX Architecture & Navigation Map
- Table mapping all proposed routes, user intents, entry points, primary CTAs, and exit pathways.

#### 2. End-to-End User Flow Diagrams (Mermaid)
- Mermaid flowcharts illustrating the primary happy paths, branching logic, and error recovery routes.

#### 3. Component & State Machine Specification
- Detailed breakdown of required layout shells, navigation components, modals/drawers, and global/local state models (e.g., active audio session state, lesson progress sync).

#### 4. Step-by-Step Code Refactoring Plan & Implementation
- Exact file modifications across `itqan-web/src/` (components, pages, navigation, CSS tokens, routing) to realize the updated UX.
