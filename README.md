# EMS Refactor Project

This repository contains the refactored and stabilized Employee Management System (EMS) frontend. This session focused on layout stability, responsive design for multiple panels, and robust data export and API integration.

## 🛠️ The Refactoring Journey (Session Summary)

This refactor was driven by a series of iterative improvements to ensure a premium user experience and technical stability. Below is a summary of the key challenges addressed based on your feedback:

### 1. Layout & Responsive Workspace
*   **The Problem:** The main workspace (Dashboard/Employees) was being hidden behind the Chatbot and Employee side sheets, or it was not shrinking correctly when multiple panels were open.
*   **The Fix:** 
    *   Implemented a **dynamic width calculation** (`calc(100% - offset)`) in `AppLayout.jsx` to force the workspace to shrink instead of overlapping.
    *   Replaced static Media Queries with **CSS Container Queries** on the Dashboard so "Recent Employees" automatically move below "Quick Actions" when the space gets tight.
    *   Removed rigid `min-width` constraints on tables to allow them to scale gracefully in constrained views.

### 2. API Stability & Error Handling
*   **The Challenge:** A "Permission Denied" (403) error appeared when viewing employee details, combined with a mismatch between frontend and backend endpoint naming.
*   **The Fix:** 
    *   Exposed and rectified API naming conventions (Singular vs Plural) based on backend `EmployeeController.java` mappings.
    *   Corrected the `getById` and `getInactiveById` endpoints to ensure full authorization success.
    *   Implemented robust `403` error handling in the side sheets with friendly UI messaging.

### 3. Data Export & Selection (CSV & UI)
*   **The Problem:** CSV exports were showing scientific notation for phone numbers (`7.03E+10`) and unreadable dates (`#######`) in Excel. Selection checkboxes were also causing page crashes.
*   **The Fix:** 
    *   **Excel Optimization:** Used special formatting wrappers for phone numbers and standardized all dates to `DD/MM/YYYY`. 
    *   **Event Refactoring:** Fixed a crash where checkbox clicks were bubbling up to row-level navigation. 
    *   **UI Simplification:** Removed the bulk selection checkboxes at your request to provide a cleaner "ID-first" table layout.
    *   **Tab-Aware Export:** Fixed the "Export" button in the header so it correctly downloads either Active or Inactive records depending on your current view.

---

## 📋 Full Prompt Log (User Requests)

1.  "when three slides are open the dash board is not shrinking, it is below add employee fix that"
2.  "on smaller screen still recent employees should move downwards not besides quick action"
3.  "when employee, add employee, chatbot re opened the table in the employee is not shrinking properly"
4.  "it not shrinked and when i clicked on employee it is showing error loading fix these things"
5.  "fix the dates, also remove check box in the Employee at left corner for every field"
6.  "when i try to export details, dob, doj, doe, phone number are not exporting properly... in active employee list there is a check box why it is there, when i click on it is showing error page why is that"
7.  "when in try to export inactive employee it is exporting active fix that"

---

## 📦 Key Technical Features Added
*   **Infinite Scrolling:** Efficiently loading employee lists as you scroll.
*   **ID-First Layout:** A cleaner, table-centric view without distracting checkboxes.
*   **Smart Export Utility:** Standardized field formatting (`Phone Formulas`, `Yes/No` booleans, `LocalDate` parsing).
*   **Refactor Components:** Lifting state from `InactiveEmployeesTable` to keep pagination and exports synchronized.

---

## 🚀 How to Run locally
1. `npm install`
2. `npm run dev` (Ensure your backend is running on `localhost:8080`)
