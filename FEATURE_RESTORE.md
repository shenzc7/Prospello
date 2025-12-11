## Restoring Hidden Features & Staying PRD-Accurate

This release ships in PRD-only mode. Use the env flags below to re-enable specific capabilities or return to the full experience. Set these in `.env.local` (or your deploy env) and restart the app.

### Quick Switches
- Disable PRD mode (enables everything):  
  `NEXT_PUBLIC_PRD_MODE=false`
- Keep PRD mode on, but enable selected features (set to `true` as needed):  
  - `NEXT_PUBLIC_ENABLE_ADMINEXTRAS` (Admin dashboard, user management, cycle controls)  
  - `NEXT_PUBLIC_ENABLE_BOARD_VIEW` (Kanban/Board)  
  - `NEXT_PUBLIC_ENABLE_USER_SWITCHER` (Role switcher)  
  - `NEXT_PUBLIC_ENABLE_NOTIFICATION_FEED` (Notifications widget)  
  - `NEXT_PUBLIC_ENABLE_PRODUCTIVITYWIDGETS` (Team progress, deadlines, at-risk, recent activity)  
  - `NEXT_PUBLIC_ENABLE_APPEARANCE_SETTINGS` (Theme/language settings)  
  - `NEXT_PUBLIC_ENABLE_INTEGRATIONS` (Google/Slack/Teams placeholders)  
  - `NEXT_PUBLIC_ENABLE_THEME_TOGGLE` (Light/Dark toggle)  
  - `NEXT_PUBLIC_ENABLE_KEYBOARD_SHORTCUTS` (Nav/table shortcuts)

### How to apply
1) Update `.env.local` with the flags you need.  
2) Restart the dev server/build.  
3) Verify the UI surfaces appear (nav items, tabs, widgets, boards).  
4) Keep PRD-only mode on for production unless explicitly approved.

### PRD Compliance Audit (keep in PRD mode)
- OKR creation/alignment: objectives with 1–5 KRs, owners, goal type (Company→Department→Team→Individual), cycle dates, weight/priority, initiatives/tasks.  
- Tracking & progress: manual KR updates with auto % calculation, objective progress bars, timeline view, end-of-cycle scoring (0.0–1.0).  
- Dashboards: Company dashboard with progress ring, heatmap; Team dashboard; Personal (My OKRs); action feed/notifications; top objectives snapshot.  
- Collaboration & check-ins: weekly check-ins with traffic-light status, comments/discussion, reminders/notifications.  
- Reporting & analytics: export OKR reports (PDF/Excel), trend analysis, alignment visualization (tree), quarterly completion rates.  
- Admin & roles: RBAC (Admin/Manager/Employee), user add/remove, team assignment, SSO hooks (Google/Slack/Teams) per PRD.  
- UX: top nav with tabs (Company | Teams | My OKRs | Reports | Settings), search bar, profile dropdown, responsive layouts.

### When in doubt
- If a surface isn’t in the PRD, leave it off in PRD mode.  
- To preview future features safely, enable only the specific flag you need.  
- Revert flags to stay PRD-clean before releases.
