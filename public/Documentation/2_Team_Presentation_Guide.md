# Team Presentation Guide: Arivolam / Campusolam

## 1. Strategy & Focus
**Recommendation on Ariv Social vs Campusolam:**
*We highly recommend focusing 100% on the Campusolam ERP for the external evaluation and skipping Ariv Social.* 
**Why?** An ERP system aligns perfectly with standard academic requirements for a BCA project (complex database schemas, multiple user roles, clear system boundaries). Combining it with a volunteer delivery system might dilute the technical narrative and confuse evaluators. Keep it structured, academic, and professional.

## 2. Walkthrough Flow (Live Demo)
1. **The Login Flow:** Demonstrate Supabase authentication. Show how the system routes users based on their roles (Dev-Admin, Admin, Faculty, Student).
2. **Dev-Admin & Admin Capabilities:** Quickly show superuser environment controls, user creation, and system configuration.
3. **Faculty Workflow (The Core):** Log in as a faculty member. Pick a class, take attendance, and enter marks. Emphasize the ease of the UI.
4. **Student Experience:** Log in as a student. Show how the attendance and marks entered by the faculty reflect instantly in the student dashboard.
5. **Campus Map (The "Wow" Factor):** Demonstrate the `/explore` interactive map to show off integration with Leaflet and spatial data. Explain the future transition to 3D and AR/VR.

## 3. Explaining Code and Technologies (If asked by external teachers)
When asked "How did you build this?", use these talking points:
*   **Next.js App Router:** "We used Next.js for our frontend because it allows Server-Side Rendering (SSR), which makes our application incredibly fast and SEO friendly. We organized our code in the `app/` directory using modern React Server Components."
*   **Tailwind CSS & Radix UI:** "For the design, we avoided heavy component libraries and instead used Tailwind CSS paired with Radix UI headless components. This gave us 100% control over the UI while maintaining web accessibility (a11y) standards."
*   **Supabase (Backend-as-a-Service):** "Instead of writing boilerplate backend code, we used Supabase. It provides a managed PostgreSQL database. We utilized Row Level Security (RLS) directly in SQL to ensure a student can only see their own marks, making the system highly secure."
*   **Mapping:** "We integrated `react-leaflet` to map our campus spatially, plotting vectors and polygons for campus buildings."

## 4. Anticipated Questions & Answers
*   **Q:** How do you handle database security?
    *   **A:** We use PostgreSQL Row Level Security (RLS) policies inside Supabase. Even if an API endpoint was exposed, the DB layer rejects unauthorized reads/writes.
*   **Q:** Why Next.js over plain React?
    *   **A:** For better routing, server components, and overall performance optimization like automatic image and font optimization.
*   **Q:** How does the attendance system scale?
    *   **A:** Our database schema normalizes attendance records, linking them via foreign keys to the student, class, and faculty tables, ensuring indexing makes retrieval instant even with thousands of records.
*   **Q:** What is the future vision for the campus map?
    *   **A:** We plan to integrate 3D campus navigation for building walk-throughs and develop AR/VR immersive tours to provide virtual reality experiences of the campus.

## 5. Preparation Checklist
- [ ] Ensure the local development server or live URL is running flawlessly.
- [ ] Create 3 test accounts beforehand with dummy data: `admin@test.com`, `faculty@test.com`, `student@test.com`.
- [ ] Add dummy attendance and marks so the charts and tables populate beautifully during the demo.
