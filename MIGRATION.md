# EMS Frontend — Refactor Migration Guide

## How to apply these changes to your project

Replace the files listed below. Everything else (assets, vite.config, package.json, etc.) stays the same.

---

## 1. Environment Variables (NEW — required)

Copy `.env.example` to `.env` in your project root and fill in your values:

```
VITE_API_BASE_URL=http://localhost:8080
VITE_CHATBOT_API_URL=http://localhost:8000/api/chatbot
VITE_PARSER_URL=http://localhost:8001
VITE_SESSION_TIMEOUT_MS=900000
```

`VITE_SESSION_TIMEOUT_MS` controls the inactivity auto-logout timer (milliseconds). Default is 15 minutes (900000).

---

## 2. File Replacement Map

Replace every file in your project with the corresponding file from this package.

```
.env.example                                    → project root

src/App.jsx                                     ← ROUTE FIX (add→new)
src/main.jsx                                    ← Toast icons improved
src/index.css                                   ← Topnav layout vars, no sidebar vars

src/api/index.js                                ← Uses VITE_API_BASE_URL

src/context/AuthContext.jsx                     ← Session timeout wired in
src/context/ThemeContext.jsx                    ← (unchanged logic, clean file)

src/hooks/useSessionTimeout.js                  ← NEW
src/hooks/useResumeParser.js                    ← Uses VITE_PARSER_URL

src/utils/dateUtils.js                          ← (unchanged)
src/utils/errorUtils.js                         ← (unchanged)

src/components/auth/ProtectedRoute.jsx          ← (unchanged)
src/components/auth/RoleRoute.jsx               ← (unchanged)
src/components/layout/AppLayout.jsx             ← REDESIGNED (topnav + avatar dropdown)

src/components/ui/BaseComponents.jsx            ← NEW (BaseInput, BaseButton, etc.)
src/components/ui/Modal.jsx                     ← Clean rewrite
src/components/ui/ConfirmDialog.jsx             ← Uses Modal
src/components/ui/Pagination.jsx                ← Accessible, ellipsis-aware
src/components/ui/Taginput.jsx                  ← (unchanged logic)
src/components/ui/ResumeUploadButton.jsx        ← Clean rewrite

src/pages/LandingPage.jsx                       ← New isolated CSS import
src/pages/LoginPage.jsx                         ← Uses BaseInput/BaseButton
src/pages/DashboardPage.jsx                     ← Account card removed, live spinners
src/pages/EmployeesPage.jsx                     ← Column sorting, default sort by empId
src/pages/EmployeeDetailPage.jsx                ← Name hover color, disabled fields styled
src/pages/NewEmployeePage.jsx                   ← RENAMED from AddEmployeePage
src/pages/InactiveEmployeesPage.jsx             ← Column sorting added
src/pages/ProfilePage.jsx                       ← Center-aligned layout
src/pages/SettingsPage.jsx                      ← Uses BaseInput/BaseButton
src/pages/ChatBotPage.jsx                       ← Uses VITE_CHATBOT_API_URL

src/styles/landing.css                          ← NEW
src/styles/login.css                            ← NEW
src/styles/dashboard.css                        ← NEW
src/styles/employees.css                        ← NEW
src/styles/employee-detail.css                  ← NEW
src/styles/new-employee.css                     ← NEW
src/styles/inactive-employees.css               ← NEW
src/styles/profile.css                          ← NEW
src/styles/settings.css                         ← NEW
src/styles/chatbot.css                          ← NEW
```

### DELETE this file (no longer used)

```
src/pages/AddEmployeePage.jsx    ← replaced by NewEmployeePage.jsx
```

---

## 3. Key Breaking Changes

### Route: `/employees/add` → `/employees/new`

The old route caused a React Router bug where `"add"` was parsed as an `:empId` param.

- **New route:** `/employees/new` → `NewEmployeePage`
- **Redirect kept:** `/employees/add` → `Navigate to="/employees/new"` so bookmarks still work
- **Update any hardcoded links** in tests, emails, or documentation that point to `/employees/add`

### Layout: Sidebar removed → Top Navbar

The old layout used `display: flex` with an `<aside>` sidebar. The new layout is:

```
<div class="app-layout-v2">          ← flex-col
  <header class="topnav">            ← fixed, 60px height
  <main class="main-v2">             ← margin-top: 60px
    <div class="page-v2">            ← max-width: 1400px, padding: 32px
```

**Remove** any custom CSS you had targeting `.app-layout`, `.sidebar`, `.main-content`, `.page-content` — these class names no longer exist.

### Session Timeout

`AuthContext` now automatically logs out the user after `VITE_SESSION_TIMEOUT_MS` of inactivity (mouse, keyboard, scroll, touch). The timer resets on any activity. On timeout, a toast appears and the user is redirected to `/login`.

---

## 4. New Reusable Components

All form inputs should now use components from `BaseComponents.jsx` for consistency:

```jsx
import { BaseInput, BaseButton, BaseSelect, BaseTextarea, FormField }
  from '../components/ui/BaseComponents'

// Instead of raw <input>:
<BaseInput
  label="Employee ID"
  icon={User}
  required
  error={errors.empId?.message}
  placeholder="TT0001"
  {...register('empId', { required: 'Required' })}
/>

// Instead of raw <button>:
<BaseButton variant="primary" loading={isPending} icon={Save}>
  Save Changes
</BaseButton>

// Available variants: primary | secondary | ghost | danger
// Available sizes:    sm | md (default) | lg
```

---

## 5. CSS Architecture

Each page now imports **only its own CSS file**. No styles are defined in `index.css` beyond global primitives (variables, reset, layout, shared utilities).

| Page          | CSS file                         |
|---------------|----------------------------------|
| Landing       | `styles/landing.css`             |
| Login         | `styles/login.css`               |
| Dashboard     | `styles/dashboard.css`           |
| Employees     | `styles/employees.css`           |
| Employee Detail | `styles/employee-detail.css`  |
| New Employee  | `styles/new-employee.css`        |
| Inactive      | `styles/inactive-employees.css`  |
| Profile       | `styles/profile.css`             |
| Settings      | `styles/settings.css`            |
| Chatbot       | `styles/chatbot.css`             |

---

## 6. Feature Checklist (verify after deployment)

- [ ] Top navbar shows all role-appropriate nav items
- [ ] Avatar button opens dropdown with name, email, roles, profile/settings links, sign out
- [ ] Logo in navbar navigates to `/` (landing page)
- [ ] `/employees/new` opens the Add Employee form
- [ ] `/employees/add` redirects to `/employees/new` (old bookmarks work)
- [ ] Employees table sorts by clicking column headers; defaults to empId asc
- [ ] Session auto-logout triggers after 15 min of inactivity
- [ ] Non-editable fields (e.g. Company Email) appear muted, no edit pencil shown
- [ ] Employee name in detail page changes color on hover
- [ ] Profile page is center-aligned
- [ ] Dashboard has no "Account Details" card
- [ ] No hardcoded localhost URLs — all via `.env`
- [ ] Each page imports its own CSS file only
