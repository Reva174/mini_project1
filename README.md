🚆 RailVend Digital Portal

Digitalising Railway Vendor Licensing — A mini full-stack React project that replaces paper-based license management for railway vendors (tea stalls, bookshops, snack carts) with a fast, digital verification system.


📌 Project Overview
Railway vendors across India still rely on physical paper licenses, manual renewals, and in-person verification. This project demonstrates how a simple digital portal can:

Let vendors apply for licenses online with validated forms
Give admins a dashboard to approve or reject applications instantly
Maintain a centralised digital registry of all vendors — no paperwork needed


🎯 Concepts Covered
ConceptTopicHow It's Used2.17API Route Structure & NamingMocked GET, POST, PATCH REST handlers with async delay2.19Input Validation with ZodCustom schema validates Aadhaar (12 digits), mobile (10 digits), name length, platform range2.28State Management — Context & HooksuseReducer + createContext manages vendors, toasts, loading, active tab globally2.30Form Handling & ValidationControlled inputs with per-field inline error display and async submit flow2.31Toasts, Modals & Feedback UIAuto-dismiss toasts on success/error, click-to-open vendor detail modal with Approve/Reject2.33Error & Loading StatesSpinner on fetch, full-screen error with retry, disabled submit button during POST

🖥️ Features

Vendor Registry — lists all vendors with status badges (approved / pending / rejected), filter by status, stat cards with counts
Apply for License — full form with real-time Zod-style validation, 7 fields including Aadhaar and mobile digit checks
Admin Panel — shows pending applications with one-click Approve / Reject via mock PATCH API
Toast Notifications — success (green), error (red), warning (amber) — auto-dismiss after 3.5s
Vendor Detail Modal — click any row to open a full detail overlay; pending vendors get action buttons inline
Mock REST API — simulates real async network delay and occasional server errors (5% chance on POST)
