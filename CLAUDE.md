CLAUDE.md — TEKTALIS EMS
🧩 1. PROBLEM
WHY
HR teams and managers lack a unified system to manage the employee lifecycle.
Tracking active vs inactive employees is manual and error-prone.
No real-time search or self-service features.
No integrated AI layer for querying employee data quickly.
WHAT
App name: Tektalis EMS
One-line:
Tektalis EMS is a full-stack Employee Management System with role-based access, JWT auth, an AI-powered SQL chatbot, and resume-to-form auto-fill.
Main capabilities:
Create, edit, and deactivate employees via detail sheets.
Role-based access control (ADMIN, MANAGER, EMPLOYEE).
Aura AI chatbot (query data in plain English, get charts/tables).
Resume PDF upload to auto-fill the Add Employee form.
Excel-optimized CSV exports.
Output:
Premium SPA dashboard with slide-out panels for employee details and AI chat.
Type:
Internal enterprise web app (SaaS architecture).
WHO
Admin
High technical skillset
Desktop heavy
Creates/deactivates employees, assigns roles, resets passwords.
Manager
Medium technical skillset
Desktop
Browses employees, views team details, uses AI chatbot for analytics.
Employee
Low technical skillset
Desktop
Views own profile, changes password.
WHEN
Daily usage by HR and managers.
Session-active throughout the workday.
SUCCESS
Employee created in < 3 clicks with resume auto-fill.
Dashboard loads instantly with cached queries.
Chatbot correctly translates natural language to SQL and renders charts.
Main content perfectly resizes when multiple side panels are open.

⚙️ 2. FEATURES
CORE FEATURES
Authentication
JWT stateless auth, silent refresh, auto-logout warnings.
Dashboard
Stat cards, department/hiring charts, recent employees list.
Employee Directory
Active/Inactive tabs, infinite scroll, debounced search, custom filtering.
Panel System
Employee detail/edit side-sheet, New Employee wizard side-sheet, Aura AI chat panel. Main layout must shrink proportionally so panels don't occlude content.
Resume Auto-fill
Upload PDF -> extract name, email, phone, DOB, skills into the form.
Aura AI Chatbot
NLP to SQL querying. Outputs data as DataTables, Bar, Line, or Pie charts. Supports voice input.
Command Palette
Press Ctrl+K to jump to routes or search employees globally.
NICE TO HAVE
Org chart view.
Bulk deactivate functionality.
OUT OF SCOPE
Mobile application.
External HRMS integrations (e.g., Workday).
Payments/Billing.

🔄 3. FLOWS
Onboarding Flow
Admin navigates to Add Employee -> Uploads resume -> Form auto-fills -> Admin assigns permissions -> System emails credentials to the new hire.
Main Flow (Managers/Admins)
Login -> View Dashboard stats -> Open Directory -> Click employee to open edit panel -> Open Aura AI and ask "Show hires by department" -> View generated chart.
Failure Handling
Access token expires -> frontend gracefully and silently gets a new token via refresh cookie.
API returns 403 -> Frontend shows clean permission denied UI, avoids infinite refresh loops.

🏗️ 4. TECH STACK
Frontend:
React 18
Vite
Zustand (for global UI/panel state)
TanStack React Query (data fetching & caching)
React Hook Form
Framer Motion (for side panel sliding animations)
Recharts
Backend:
Spring Boot 3 (Core API)
Spring Security (JWT Management)
Python / FastAPI (AI Chatbot Microservice)
Database:
PostgreSQL
AI:
Groq LLaMA

🧠 5. DATA MODEL
Employee:
empId, name, companyEmail, personalEmail, phoneNumber, address, department, designation, skills, dateOfJoin, dateOfBirth, description.
Roles:
Enum array [ADMIN, MANAGER, EMPLOYEE]

🔌 API
POST /auth/login - Authenticate and get tokens
POST /auth/refresh - Silent JWT renewal
GET /ems/employees - Paginated search
POST /ems/employee - Create new record
PATCH /ems/update/{empId} - Partial update
DELETE /ems/employee/{empId} - Deactivate user
POST /api/chatbot/query - Send natural language, receive JSON charting data

🔐 SECURITY
Strict 3-tier RBC (Role-Based Access Control).
JWT access tokens stored in memory, refresh tokens as HTTP-only secure cookies.
BCrypt password hashing.

🎨 DESIGN
Dark mode default, glassmorphism UI elements.
Lucide icons.
Dynamic layout computing (`calc(100% - panelWidth)`) to accommodate sliding right-side panels.
Primary accent color: Indigo.

🔁 TASKS
Setup robust Axios interceptor for silent JWT refresh.
Build the dynamic horizontal layout orchestration.
Implement the multi-step Employee Registration wizard.
Integrate visual charting into the AI chatbot responses.

🧪 TESTING
Vitest for utility functions.
FocusTrap tests for accessibility on panels.

🚀 SCALE
Start: 100 employees
Target: 10,000 employees with optimized infinite scrolling.

🔑 ENV
VITE_API_BASE_URL
VITE_CHATBOT_API_URL
VITE_PARSER_URL
VITE_SESSION_TIMEOUT_MS

⚠️ CONSTRAINTS
Ensure the main dashboard never gets obscured when right-side panels open.
Prevent infinite auth looping on 403 unauthorized requests.

🧾 BUILD INSTRUCTIONS
- Build the full system end-to-end without asking for confirmation.
- When given this file, immediately scaffold ALL layers: frontend, backend, database, extensions, jobs.
- Do not stop to ask "should I build X next?" — just build it.
- Output production-ready code for every component listed in the tech stack.
- Create all files, folder structures, configs, and boilerplate necessary.
- If something is ambiguous, make a reasonable engineering decision and note it inline as a comment.
- Build the full production-ready system with all features.
