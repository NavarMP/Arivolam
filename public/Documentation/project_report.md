# Project Report

ARIVOLAM: All-in-One Educational Platform

# TABLE OF CONTENTS

1. ABSTRACT..................................................6
2. INTRODUCTION.............................................. 6
    2. 1. Problem Statement ....................................................7
    2. 2. Project Motivation ................................................... 7
    2. 3. Objectives of the Project ...........................................8
    2. 4. Scope of the Project ................................................. 8

3. SYSTEM ANALYSIS.........................................13
    3. 1. Existing System.....................................................   14
    3. 2. Problems and Limitations of Existing System ......... 15
    3. 3. Proposed System..................................................... 14
    3. 4. Feasibility Study ...................................................    16
        3. 4. 1. Technical Feasibility.............................            16
        3. 4. 2. Operational Feasibility ...........................           16
        3. 4. 3. Economic Feasibility ...............................         16

4. SYSTEM DESIGN ............................................. 23
    4. 1. System Architecture Diagram .....................................23
    4. 2. Data Flow Diagrams ...........................................24
    4. 3. Use Case Diagram ...........................................24

5. IMPLEMENTATION............................................ 33
    5. 1. Tools, Languages, and Frameworks ...............................33
    5. 2. Code Explanation.....................................................     34
    5. 3. Frontend / Backend / UI Implementation ......................35
    5. 4.  Model Logic ............................................. 36

6. TESTING AND VALIDATION .................................. 34
    6. 1. Unit Testing ....................................................         34
    6. 2. System Testing........................................ 35
    6. 3. Integration Testing .................................................     37

7. GUI SCREENSHOTS................................... 38

8. RESULTS AND DISCUSSION.......................................40
    8. 1. Observations  ....................................................         34
    8. 2. Limitations....................................... 35

9. FUTURE ENHANCEMENTS ..............................                          41
10. CONCLUSION ..............................   
11. APPENDIX......................
A. Source Code...........................................................       43

# ACKNOWLEDGEMENT

First and foremost, we express our deepest gratitude to the Almighty God for His abundant blessings, guidance, and grace that have illuminated our path and granted us strength and resilience throughout our academic pursuits.

We are immensely grateful to the Principal, Prof. E. P. Imbichikoya for their visionary leadership, unwavering support, and commitment to fostering an environment of excellence and innovation within our institute.

Our sincere thanks go to the Head of the Department, Mr. Abdul Samad C for their invaluable guidance and encouragement, which have been instrumental in nurturing our intellectual curiosity and facilitating our academic growth.

We extend our heartfelt appreciation to our Project Guide Mrs. Safeena C for his/her wisdom and guidance have been invaluable assets in our academic journey.

We would also like to express our gratitude to our teachers for their commitment has been instrumental in shaping our understanding and appreciation of the field of Computer Science. To our families, whose unwavering love, encouragement, and sacrifices have been the bedrock of our support system, we offer our deepest appreciation and gratitude.

Lastly, but certainly not least, we extend our heartfelt thanks to our friends, whose companionship, camaraderie, and encouragement have enriched our lives and made this journey memorable and enjoyable. Together, we have achieved significant milestones, and we embark on the next phase of our journey equipped with knowledge, skills, and memories that will last a lifetime.Thank you all for your unwavering support, guidance, and encouragement.

# 1. ABSTRACT

ARIVOLAM: All-in-One Educational Platform

Arivolam is an innovative digital platform architected to solve the pressing issue of digital fragmentation within educational institutions. By consolidating two distinct yet complementary initiatives into a unified application—Ariv Social and Campusolam—this system provides a transformative experience for students, faculty, and administrators. The existing ecosystem in many colleges suffers from scattered digital tools; information is siloed across disparate portals, leading to inefficiencies, miscommunication, and a poor user experience.

Arivolam rectifies these limitations. Ariv Social functions as a vibrant community hub, enabling students and faculty to share updates, engage in discussions, and foster a connected campus culture. Campusolam serves as the operational backbone, offering a highly interactive and detailed campus map for navigation, room search, and infrastructural awareness, along with dedicated features like real-time attendance tracking and academic management.

Developed utilizing a modern, full-stack technology architecture—featuring Next.js, React, Tailwind CSS for a responsive frontend, and Supabase (PostgreSQL) for a scalable and secure backend—Arivolam ensures a reliable, seamless, and high-performance digital environment. This platform effectively minimizes digital friction, bridging the gap between social engagement and academic administration, and paving the way for a more integrated, intelligent, and efficient campus life.

Technologies Used:
Frontend – Next.js, React, Tailwind CSS, Leaflet/Mapbox (for Campus Navigation)
Backend – Next.js API Routes, Supabase
Database – PostgreSQL (via Supabase)

# 2. INTRODUCTION

    2. 1. Problem Statement
Educational institutions frequently adopt multiple, disconnected software solutions to manage different aspects of campus life. Students might use one platform for checking attendance, another for academic announcements, and yet another for navigating the physical campus. This digital fragmentation results in confusion, data silos, and an overall subpar user experience. Stakeholders struggle to keep track of disparate logins and interfaces, reducing engagement and operational efficiency. There is a critical need for a unified platform that consolidates social connectivity, academic management, and spatial navigation.

    2. 2. Project Motivation
The motivation behind Arivolam stems from witnessing firsthand the challenges students and faculty face daily due to fragmented information systems. A student trying to locate a specific classroom or a faculty member attempting to track attendance shouldn't navigate through multiple clunky systems. By integrating these essential services into a single, cohesive application—Ariv Social for community building and Campusolam for logistics and administration—we aim to drastically enhance the quality of campus life. Our goal is to create an intuitive, secure, and modern digital environment that empowers all campus stakeholders.

    2. 3. Objectives of the Project
- To develop a unified digital platform (Arivolam) combining campus social networking (Ariv Social) and operational management (Campusolam).
- To implement an interactive campus navigation system featuring deep-linking for rooms, progressive zooming, and multi-floor support.
- To provide a robust attendance tracking system with real-time updates for faculty and students.
- To create a secure, role-based architecture distinguishing between common users, students, faculty, administrators, and dev-admins.
- To ensure a highly responsive and visually appealing user interface utilizing modern web development frameworks.
    2. 4. Scope of the Project
The scope of Arivolam encompasses the design, development, and deployment of a full-stack web application. It includes user registration and intricate role-based authentication. Ariv Social modules will handle posts, announcements, and user interactions. Campusolam modules will manage interactive campus mapping, room search functionality, and attendance management systems. The project will ensure data security through Supabase Row Level Security (RLS) policies and provide administrative dashboards for data management, while intentionally leaving the physical deployment of hardware (like biometric scanners) outside the current scope.

# 3. SYSTEM ANALYSIS

System analysis for Arivolam involves dissecting the current fragmented state of campus digital tools and defining a structurally sound, unified solution. It requires a deep understanding of user roles—how a student interacts with course material versus how an administrator manages campus map data—and ensuring the proposed architecture supports these diverse needs seamlessly.

    3. 1. Existing System
Currently, the institution relies on isolated systems. Attendance might be tracked via spreadsheets or legacy ERP systems, campus announcements rely on physical notice boards or disjointed email threads, and navigating the campus relies entirely on static, outdated physical maps or simple word-of-mouth. Different departments might use completely different tools.

    3. 2. Problems and Limitations of Existing System
- Digital Fragmentation: Users must switch between multiple apps or portals.
- Inefficiency: Manual attendance tracking and scattered announcements lead to wasted time and miscommunication.
- Poor Navigation: New students and visitors struggle to find specific rooms or buildings due to the lack of interactive digital maps.
- Lack of Engagement: The absence of a centralized social platform diminishes the sense of community on campus.
- Data Silos: Integrating data across different platforms is difficult, hindering administrative oversight.

    3. 3. Proposed System
The proposed Arivolam system is a consolidated web application engineered to replace these disparate tools. 

Key features include:
- Unified Authentication: A single secure login for all features.
- Role-Based Access Control: Distinct interfaces and permissions for students, faculty, and admins.
- Ariv Social: A feed for campus updates, events, and academic discussions.
- Campusolam Map Viewer: An advanced, interactive map with a 6-tier progressive zoom, multi-floor switching, and room search capabilities.
- Attendance Management: Real-time tracking and reporting for classes.
- Admin Panel: Centralized control for user management, map data editing, and system configuration.
    3. 4. Feasibility Study

A feasibility study confirms that Arivolam is practically achievable within the defined constraints and resources.

    3. 4. 1. Technical Feasibility
- The chosen stack (Next.js, React, Supabase) is highly robust and industry-standard for building complex, scalable web applications.
- Map integration using Leaflet and React-Leaflet is well-documented and highly feasible for the required navigation features.
- Supabase provides ready-to-use secure authentication and PostgreSQL database management, significantly reducing backend development overhead.
- The system will be hosted on scalable cloud platforms (like Vercel and Supabase), ensuring high availability.
    3. 4. 2. Operational Feasibility
- The user interface is designed with a focus on modern UX/UI principles, ensuring an intuitive experience for both tech-savvy students and administrators.
- Consolidating systems reduces the administrative burden of maintaining multiple platforms.
- The distinction between Ariv Social and Campusolam within one app provides a clear operational structure for users.
    3. 4. 3. Economic Feasibility
- Utilizing open-source and generous free-tier services (like Next.js on Vercel and Supabase) minimizes initial setup and hosting costs.
- The system eliminates expenses associated with printing physical notices and maintaining multiple software subscriptions.
- The primary cost is development time, which is offset by the significant long-term operational efficiencies gained.

# 4. SYSTEM DESIGN

System design for Arivolam translates the analyzed requirements into a concrete technical architecture. It involves structuring the Next.js frontend pages, designing the Supabase database schema, and defining the API interactions between them.

4. 1. System Architecture Diagram
Arivolam utilizes a client-server architecture. The Client (Browser/Mobile) interacts with the Next.js Frontend. The Frontend communicates securely with the Next.js Backend (API Routes) and directly with Supabase via the Supabase JS Client for authenticated operations. Supabase handles Authentication, PostgreSQL Database operations, and Storage (for images and map assets), returning data to the Frontend for rendering.

4. 2. Data Flow Diagrams
- Level 0: A user interacts with the Arivolam system, providing login details, viewing social feeds, or querying map locations, and receiving responses like authenticated sessions, post data, or map navigation paths.
- Level 1: Details processes like 'User Authentication' (communicating with the Users table), 'Map Navigation' (pulling data from Buildings/Rooms tables), and 'Social Interaction' (managing Posts and Comments).

4. 3. Use Case Diagram
- Student: Logs in, views Ariv Social feed, searches for a classroom on the Campusolam map, checks their attendance.
- Faculty: Logs in, posts announcements, marks attendance for a class cycle, views analytical academic reports.
- Admin: Manages map data (adds new buildings/floors), manages user roles, moderates Ariv Social content.

# 5. IMPLEMENTATION

The implementation phase translates the system design into functional code, building out the Arivolam application using the selected technology stack.
    5. 1. Tools, Languages, and Frameworks
- Frontend: Next.js (React framework), TypeScript, Tailwind CSS (for styling), GSAP/Framer Motion (for animations).
- Map Tools: Leaflet, React-Leaflet, @geoman-io/leaflet-geoman-free (for map editing).
- Backend/Database: Supabase (PostgreSQL, Authentication, Realtime datastore).
- UI Components: Radix UI, Lucide React (for icons).
    5. 2. Code Explanation
The repository is structured following Next.js App Router conventions:
- `/app`: Contains all routing, pages, and API endpoints (e.g., `/app/profile`, `/app/map`).
- `/components`: Reusable UI elements and complex widgets like the MapViewer or SocialFeed.
- `/lib` and `/utils`: Helper functions, database clients, and configuration files.
    5. 3. Frontend / Backend / UI Implementation
The frontend is built with React components, styled responsively utilizing Tailwind CSS to ensure mobile compatibility. Complex interactive elements, such as the 6-tier progressive zoom map, are implemented using specialized libraries (Leaflet). The backend relies on Supabase, which provides a RESTful API generated instantly from the PostgreSQL schema. We implemented Row Level Security (RLS) policies within Supabase to ensure that, for instance, a student can only view their own attendance, while a faculty member can view attendance for their assigned classes.
    5. 4. Model Logic
The core logic resides in how data is structured and related in the PostgreSQL database.
- Profiles Table: Stores user metadata, linked via foreign key to the Supabase Auth system. Distinct roles (student, faculty) determine UI rendering.
- Map Layout (Buildings, Floors, Rooms): A relational structure where a Room belongs to a Floor, and a Floor belongs to a Building. This allows the progressive map zoom and floor-switcher features to pull data hierarchically.
- Attendance Logic: Links a Student to a Course/Session, calculating aggregate presence versus un-marked absences efficiently.

# 6. TESTING AND VALIDATION

Testing ensures that Arivolam is reliable, secure, and performs optimally before deployment.
    6. 1. Unit Testing
Individual components and utility functions are tested in isolation. For example, testing the logic that structures profile URLs to ensure personal accounts route to `/[username]` and institutional accounts route to `/institution/[username]`, preventing 404 errors.
    6. 2. System Testing
Testing the platform as a complete entity. This involves navigating the application end-to-end: logging in, viewing a social post, switching to the map view, searching for a specific room, and ensuring the UI responds appropriately at every step across different device sizes.
    6. 3. Integration Testing
Verifying the interactions between the Next.js frontend and the Supabase backend. Key scenarios include testing image uploads to Supabase storage (bypassing specific restrictive policies safely via backend API routes) and ensuring real-time features like the attendance "Save/Confirm" button correctly update the PostgreSQL database.

# 7. GUI SCREENSHOTS

(Screenshots illustrating the Arivolam platform will be attached here, including:
- The modern, responsive login interface.
- Ariv Social feed displaying announcements and user interactions.
- Campusolam Map Viewer showing progressive zoom levels and the building/floor selector panel.
- The Attendance Dashboard for faculty and students.)

# 8. RESULTS AND DISCUSSION

8. 1. Observations
The implementation of Arivolam successfully demonstrated the viability of a unified campus digital platform. The interface is intuitive, and consolidating Ariv Social with Campusolam significantly reduced navigation friction for users. The interactive map engine, equipped with deep-linking and floor switching, proved highly effective in resolving spatial navigation issues on campus. Database queries via Supabase were performant, handling relationship mapping smoothly.

8. 2. Limitations
The primary architectural limitation observed is the inherent complexity of merging two distinct initiatives—a social network (Ariv Social) and a utility application (Campusolam)—into a single monolith. As the application grows, managing state and scaling these disparate features simultaneously may become challenging. The current map system, while highly functional, relies on 2D rendering and does not yet support complex indoor routing algorithms (e.g., calculating the shortest path avoiding stairs for accessibility).

# 9. FUTURE ENHANCEMENTS

To ensure Arivolam continues to meet user needs, several future enhancements are planned:
- Architectural Splitting: Evaluating the technical feasibility of splitting Ariv Social and Campusolam into distinct microservices or separate applications sharing a common authentication layer to improve maintainability.
- Advanced Navigation: Implementing advanced indoor routing (A* algorithm) and integration of indoor positioning systems (like Beacons or Wi-Fi triangulation) for real-time blue-dot navigation.
- AI Integration: Incorporating AI-driven features, such as predictive attendance analytics, smart timetable scheduling, or an AI assistant for navigating campus resources.
- Enhanced Accessibility: Improving accessibility standards (WCAG compliance) across all UI components and offering multi-lingual support (e.g., Malayalam and English).
- Gamification: Introducing gamified elements to Ariv Social to boost student engagement and participation in campus events.

# 10. CONCLUSION

Arivolam represents a significant leap forward in campus digital infrastructure. By successfully integrating the community-building aspects of Ariv Social with the operational and navigational utilities of Campusolam, the platform fundamentally resolves the issue of digital fragmentation. The utilization of a modern technology stack—Next.js, React, and Supabase—has resulted in a robust, scalable, and highly performant application. While there are architectural considerations for future scaling, the current implementation delivers a secure, user-friendly, and highly functional environment that greatly enhances the educational experience for students, faculty, and administration alike.

# 11. APPENDIX

A. Source Code

(Select snippets of critical application code, such as:
- Next.js routing configuration for dynamic profile URLs.
- React components managing the Leaflet map state and floor switching.
- Supabase data fetching logic and Row Level Security policy definitions.)
    8. 3. System Minimum Requirements

Software configuration:
Operating system : Windows 10/11, macOS, Linux, Android, iOS (via browser)
Frameworks : Next.js 16.x, React 19.x
Styling : Tailwind CSS
Backend/Database : Supabase (PostgreSQL)
IDE : Visual Studio Code
Supported Browsers : Modern versions of Chrome, Safari, Firefox, Edge

Hardware configuration (Client constraints for optimal map rendering):
Processor : Modern Dual-core processor or better
Monitor : Any standard resolution display
RAM : Minimum 4 GB (8 GB recommended for heavy map interaction)
Internet : Stable broadband or 4G connection