# 💎 CRYSTAL RULES: IMMUTABLE LAW

## 1. 🛡️ TECH STACK CONSTRAINTS
*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript (Strict Mode)
*   **Styling:** Tailwind CSS (Utility-first)
*   **Database:** Prisma ORM (SQLite for Dev / Postgres for Prod)
*   **Auth:** NextAuth.js v5
*   **Icons:** Lucide React
*   **UI Components:** Shadcn/UI base

## 2. ⚡ CODING STANDARDS (STRICT)

### TypeScript
*   **NO `any` TYPE:** Strict type safety is mandatory. Use `unknown` or define an `interface`.
*   **NO `// @ts-ignore`:** Fix the underlying issue.
*   **Import Order:** 1) React/Next, 2) External libs, 3) Internal `@/` imports, 4) Relative imports.

### React / Next.js
*   **Server Components by Default:** Only add `"use client"` when interactivity (state, hooks) is strictly required.
*   **Functional Components:** Use arrow functions: `const Component = () => {}`.
*   **Naming:** PascalCase for components, camelCase for functions/vars.
*   **File Naming:** kebab-case for files (e.g., `objective-form.tsx`).

### State Management
*   **URL as State:** Prefer URL search params for bookmarkable state (filters, pagination).
*   **Server Actions:** Use Server Actions for mutations. Avoid API routes unless necessary for external webhooks.

### OKR-Specific Rules
*   **Key Results:** Min 1, Max 5 per Objective. Validate on form submission.
*   **Weights:** Key Result weights must sum to ≤ 100 per Objective.
*   **Progress Calculation:** `(current / target) * 100`, clamped to 0-100.
*   **Traffic Light Status:**
    - 🟢 Green: Progress ≥ 70%
    - 🟡 Yellow: Progress 40-69%
    - 🔴 Red: Progress < 40%

## 3. 🚨 SAFETY PROTOCOLS
*   **Destructive Ops:** NEVER drop tables or delete data without explicit user confirmation.
*   **Secrets:** NEVER hardcode secrets. Use `process.env`.
*   **Dependencies:** Check `package.json` before importing. Do not recommend `npm install` unless essential.
*   **Prisma Migrations:** Always run `npx prisma db push` after schema changes in dev.

## 4. 📝 DOCUMENTATION
*   **Self-Documenting Code:** Clear variable names > comments.
*   **JSDoc:** Use for complex utility functions.
*   **Component Props:** Always define interfaces for component props.

## 5. 🎨 UI/UX PRINCIPLES (From PRD)
*   **Clean, minimal UI:** Avoid clutter, focus on what matters.
*   **Colors with meaning:** Green (On Track), Yellow (Needs Attention), Red (At Risk)
*   **Typography:** Bold for Objectives, lighter for Key Results.
*   **Responsiveness:** Desktop full view, Mobile prioritizes My OKRs + Notifications.
*   **30-Second Rule:** Within 30 seconds of opening dashboard, user should know:
    1. Where the company stands (overall %)
    2. Which teams/OKRs are at risk
    3. What they personally need to act on
