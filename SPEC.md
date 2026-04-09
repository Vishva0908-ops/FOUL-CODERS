# AskBox - Anonymous Classroom Question Tool

## Project Overview
- **Name**: AskBox
- **Type**: Single-page demo application
- **Core Functionality**: Anonymous question submission for students with live teacher dashboard
- **Target Users**: Students and teachers in classroom settings

## Views & Navigation

### URL Hash Routing
- `#student` or no hash → Student View (default)
- `#teacher` → Teacher Dashboard

### View Toggle
- Navigation button in student view footer
- Navigation button in teacher dashboard header

---

## Student View

### Layout
- Centered card on soft gradient background (indigo/purple tones)
- AskBox logo/wordmark at top
- Hero text: "Ask anything. Stay anonymous."

### Components
1. **Logo/Wordmark**
   - Text: "AskBox" with small speech bubble icon
   - Positioned at top center

2. **Class Code Input**
   - Label: "Class Code"
   - Placeholder: "e.g. MATH101"
   - Max 10 characters, auto-uppercase

3. **Question Textarea**
   - Placeholder: "Ask anything... your name stays secret 👀"
   - Min 3 rows, max 10 rows (auto-grows)
   - Character limit: 500

4. **Submit Button**
   - Text: "Send Anonymously ✈️"
   - Full width, prominent styling
   - Hover: slight lift effect

5. **Confirmation Card** (shown after submit)
   - Message: "Your question flew away! 🚀 The teacher will answer it soon."
   - Fade-in animation
   - "Ask Another" button to reset form

6. **Footer**
   - Floating "Switch to Teacher View →" link

### Behavior
- On submit: validate inputs, save to localStorage, show confirmation
- Form resets after confirmation dismissal

---

## Teacher Dashboard

### Login Screen
- Centered card
- Password input (type: password)
- Login button
- Error message for wrong password
- Hardcoded password: `demo123`

### Dashboard (post-login)

#### Header
- Class code badge: "MATH101"
- Title: "Live Questions"
- Question count badge (e.g., "5 questions")
- Logout button

#### Filter Bar
- Three toggle buttons: All | Unanswered | Starred
- Active state clearly indicated

#### Question Feed
- Scrollable list of question cards
- Each card contains:
  - Question text
  - Timestamp (relative: "2 mins ago")
  - "Answered ✓" toggle button (turns green when active)
  - "⭐ Star" toggle button (turns gold when active)
  - Fade-in animation on new questions

#### Empty State
- Friendly message when no questions match filter

### Behavior
- Filters work client-side
- Question state persisted in localStorage
- Auto-refreshes when new questions submitted

---

## Data Structure

### Question Object
```javascript
{
  id: string,          // UUID
  text: string,        // Question content
  classCode: string,   // e.g. "MATH101"
  timestamp: number,   // Unix timestamp
  answered: boolean,   // Default: false
  starred: boolean     // Default: false
}
```

### localStorage Keys
- `askbox_questions`: JSON array of question objects
- `askbox_teacher_logged_in`: boolean (session flag)

### Sample Questions (pre-populated on first load)
1. "Can you explain the quadratic formula one more time?" - 12 mins ago, MATH101
2. "What's the difference between a function and a relation?" - 8 mins ago, MATH101
3. "Why do we need to learn about fractions in real life?" - 5 mins ago, MATH101, starred
4. "Could you give an example of when to use the distributive property?" - 2 mins ago, MATH101, answered
5. "How do I simplify radicals? I keep getting confused." - 1 min ago, MATH101

---

## Design Specification

### Color Palette

**Student View**
- Background gradient: `#667eea` → `#764ba2` (soft indigo to purple)
- Card background: `rgba(255, 255, 255, 0.95)`
- Primary text: `#1a1a2e`
- Secondary text: `#6b7280`
- Accent/button: `#4f46e5` (indigo)
- Button hover: `#4338ca`

**Teacher Dashboard**
- Background: `#f9fafb`
- Card background: `#ffffff`
- Header: `#1e1b4b` (dark indigo)
- Primary text: `#111827`
- Secondary text: `#6b7280`
- Accent: `#4f46e5`
- Success (answered): `#10b981`
- Star (highlighted): `#f59e0b`
- Border: `#e5e7eb`

### Typography
- Font family: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`
- Headings: 600 weight
- Body: 400 weight
- Sizes:
  - Logo: 28px
  - H1: 24px
  - H2: 18px
  - Body: 16px
  - Small: 14px

### Spacing
- Base unit: 8px
- Card padding: 24px
- Element gap: 16px
- Section gap: 24px

### Animations
- Card fade-in: `opacity 0→1, translateY 10px→0, 300ms ease-out`
- Button hover: `transform translateY(-2px), 150ms ease`
- Submit button pulse on click: `scale 0.95→1, 200ms`
- Confirmation card: fade + scale `0.9→1, 400ms ease-out`

### Mobile Responsiveness
- Max content width: 480px (student), 640px (dashboard)
- Padding adjusts for small screens
- Touch-friendly tap targets (min 44px)

---

## Acceptance Criteria

1. [ ] Student view displays with correct gradient background and all form elements
2. [ ] Class code input auto-uppercases and limits to 10 chars
3. [ ] Question textarea auto-grows and has 500 char limit
4. [ ] Submit shows confirmation card with animation
5. [ ] Teacher login accepts "demo123" and rejects other passwords
6. [ ] Dashboard shows pre-populated sample questions
7. [ ] Filter buttons correctly filter All/Unanswered/Starred
8. [ ] Answered and Starred toggles work and persist
9. [ ] New student submissions appear instantly in dashboard
10. [ ] All data persists via localStorage across page reloads
11. [ ] URL hash navigation works between views
12. [ ] Mobile layout is clean and usable
13. [ ] All animations are smooth (no jank)
