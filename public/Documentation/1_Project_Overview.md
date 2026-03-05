# Arivolam: Project Overview (Ariv Social + Campusolam)

## 1. Introduction
Arivolam is an all-in-one educational platform consisting of two primary initiatives integrated into a single unified application:
1. **Ariv Social:** A social media network tailored for institutions and anyone interested in academics to build communities and share knowledge.
2. **Campusolam:** A comprehensive Educational Resource Planning (ERP) and Learning Management System (LMS) designed to streamline campus administration and academics.

## 2. Core Modules & User Roles
Arivolam handles a complex, multi-tenant ecosystem consisting of specific user roles:

**Common / Global Users:**
- **Dev-Admin:** Superuser control for core platform settings, environment configurations, and global management.
- **Public User:** General users browsing public-facing institutional pages or social feeds.

**Ariv Social Users:**
- **Personal Accounts:** Individual profiles for students, educators, and academic enthusiasts.
- **Institution Accounts:** Verified institutional profiles managing their public presence and internal communities.

**Campusolam ERP/LMS Users:**
- **Admin:** Centralized control for managing campus users, academic calendars, and system resources.
- **Faculty:** Tools for attendance tracking, marks entry, and academic performance monitoring.
- **Student:** Real-time access to attendance, assignments, grades, and timetables.

## 3. Technology Stack
- **Frontend Framework:** Next.js (React 19)
- **Styling & UI:** Tailwind CSS, Radix UI Primitives
- **Animations:** Framer Motion, GSAP
- **Mapping & GIS:** Leaflet, React-Leaflet, Turf.js
- **Backend & Database:** Supabase (PostgreSQL, Authentication, Row Level Security)
- **Deployment:** Vercel (or Custom CI/CD Auto-Deploy)

## 4. Architectural Limitations & Disadvantages
- **Merged Platform Conflicts:** Because Ariv Social (open communities) and Campusolam (strict ERP) are currently combined into one application, it creates conflicts in the user login flows and forces a slight decrease in enterprise-level security isolation to accommodate social features. In the future, these initiatives will be split into two separate apps to maximize data boundaries.

## 5. Future Enhancements
- 3D, AR/VR navigation for the interactive campus map.
- Automatic attendance system using RFID and sensors for students and faculties.
- Maximum possible languages support using AI (i18n).
- AI-based insights and analysis within the LMS.
- Payment gateway and in-app payments.
