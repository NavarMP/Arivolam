# Arivolam - Campus Unified Platform
## Next.js Web App Development Prompt & Specification

**Project Name:** Arivolam: The Horizon of Learning  
**Technology:** Next.js (React Framework)  
**Institution:** SAFI Institute, Vazhayur, Calicut University  
**Date:** December 4, 2025

---

## 🎯 PROJECT OVERVIEW

Develop a comprehensive, modern **Next.js web application** that consolidates all campus operations into a single unified platform. The application must replace fragmented tools (WhatsApp, Moodle, Google Meet, Google Classroom, ERP systems) with an integrated, user-friendly interface.

---

## 📋 CORE FEATURES & MODULES

### 1. **Authentication & Role-Based Access**
- Multi-role login system:
  - **Admin:** Full system control, user management, reporting
  - **Teacher/Faculty:** Course management, grading, student monitoring
  - **Student:** Dashboard, course enrollment, assignments
  - **Librarian:** Library management and resources
  - **Support Staff:** Ticket management and user support
- Secure JWT authentication with refresh tokens
- Password reset and forgot password functionality
- Session management and auto-logout on inactivity
- OAuth2 integration (Google, Microsoft) for quick login

---

### 2. **Attendance Management**
- **Student View:**
  - Check personal attendance percentage
  - View attendance history with dates and courses
  - Attendance trends (visual chart)
  - Attendance alerts (warning if below threshold)

- **Teacher View:**
  - Mark attendance for class (bulk or individual)
  - Import attendance from CSV
  - View class attendance statistics
  - Generate attendance reports

- **Admin View:**
  - Monitor institutional attendance metrics
  - Set attendance policies and thresholds
  - Generate department-wide reports

**UI Components:**
- Attendance calendar heatmap
- Real-time sync with database
- Mobile-responsive attendance forms

---

### 3. **Library Management**
- **Student Features:**
  - Search library catalog (books, journals, e-resources)
  - View book availability and location
  - Request/reserve books online
  - Track borrowed items and due dates
  - Renew borrowed items
  - View fine status and payment options
  - Access e-resources and digital library

- **Librarian Features:**
  - Add/update/delete books in catalog
  - Issue and return book tracking
  - Manage reservations and holds
  - Generate overdue reminders
  - View inventory and reports
  - Track library statistics

**Features:**
- QR code scanning for quick checkout
- Integration with library database (if existing)
- Late fee calculation and payment gateway
- Email notifications for due dates and overdue items

---

### 4. **Campus Navigation**
- **Interactive 2D Campus Map:**
  - Zoomable, pannable campus layout
  - Marker-based location system (classrooms, labs, cafeteria, library, etc.)
  - Real-time location search with autocomplete

- **3D Campus Visualization (Future Enhancement):**
  - Three.js integration for 3D campus model
  - First-person navigation
  - Building floor plans

- **Navigation & Directions:**
  - Pathfinding algorithm (Dijkstra's) for optimal routes
  - Turn-by-turn directions with distance and time
  - Accessibility information (elevators, ramps, etc.)
  - Location details (opening hours, contact, facilities)

- **AR Navigation (Future Phase):**
  - AR.js integration for camera-based wayfinding
  - Real-time directional arrows overlaid on camera
  - Indoor positioning system (GPS alternative)

**UI Components:**
- Full-page interactive map with filters
- Location detail panel with photos
- Route calculation and sharing
- Bookmark favorite locations

---

### 5. **AI Integration**
- **Smart Features:**
  - **Chatbot:** AI-powered student support chatbot (FAQ answering)
  - **Recommendation Engine:** Suggest courses based on academic history
  - **Predictive Analytics:** Flag at-risk students based on performance trends
  - **Automated Scheduling:** AI-suggest optimal class timings
  - **Grade Prediction:** Estimate future grades based on current performance
  - **Document Summarization:** Auto-summarize course materials

- **Implementation:**
  - Use OpenAI API or Hugging Face models
  - Implement RAG (Retrieval Augmented Generation) for campus-specific queries
  - NLP-based assignment plagiarism detection

**UI Components:**
- Chat widget (bottom-right corner)
- Insights dashboard with AI predictions
- Smart search with semantic understanding

---

### 6. **Fee Management**
- **Student Features:**
  - View fee structure and breakdown
  - Check payment status (paid/pending/overdue)
  - View payment history and receipts
  - Online payment gateway integration
  - Download fee receipts
  - Set up payment reminders
  - View scholarship information

- **Admin/Finance Features:**
  - Create and manage fee structures
  - Generate fee invoices (bulk or individual)
  - Track payment status and defaulters
  - Generate financial reports
  - Manage discounts and scholarships
  - Send payment reminders (automated)

- **Payment Gateway Integration:**
  - Razorpay or PayU integration for Indian payments
  - Multiple payment options (Credit Card, Debit Card, UPI, NetBanking)
  - Automated invoice generation
  - Payment confirmation emails

**UI Components:**
- Fee dashboard with visual breakdown
- Payment history timeline
- Online payment modal
- Receipt download button
- Payment reminder notifications

---

### 7. **Open-Source Video Conferencing Service Integration**
- **Integration Options:**
  - **Jitsi Meet** (Recommended: Open-source, self-hosted capable)
  - **BigBlueButton** (Educational focus)
  - **OpenVidu** (WebRTC-based)

- **Features:**
  - Start/Join live lectures
  - Schedule classes with auto-generated meeting links
  - Recording capabilities
  - Screen sharing
  - Chat during video calls
  - Participant management (mute, remove, etc.)
  - Meeting history and recordings access

- **Teacher Features:**
  - Create and schedule video classes
  - Control participant permissions
  - Start recording with one click
  - Download recordings after class

- **Student Features:**
  - Join scheduled lectures
  - View recorded lectures
  - Participate in live discussions
  - Submit questions via chat

**UI Components:**
- Video meeting room embedded in app
- Scheduled classes calendar
- Meeting join button with authentication
- Recordings library with search

---

### 8. **In-Built Group Discussion Forum**
- **Discussion Features:**
  - Create discussion threads (by teacher/students)
  - Category-wise organization (Courses, General, Clubs, etc.)
  - Nested replies and threading
  - Pin important discussions
  - Mark as solved/closed
  - Voting system (upvote/downvote)
  - Search and filter discussions

- **Moderation:**
  - Delete inappropriate posts
  - Ban users
  - Approve posts before publishing (if enabled)

- **Notifications:**
  - Notify on new replies to watched threads
  - Email notifications for important discussions
  - @mention notifications

**UI Components:**
- Discussion board with category tabs
- Thread detail view with nested replies
- Rich text editor for posting
- User reputation system (badges)
- Search and sort options

---

### 9. **Notifications System**
- **Notification Types:**
  - Assignment deadlines
  - Grade updates
  - Course announcements
  - Library due date reminders
  - Fee payment reminders
  - New discussion replies
  - Event registrations
  - System announcements

- **Notification Channels:**
  - In-app notifications (bell icon with badge counter)
  - Email notifications (configurable)
  - Push notifications (browser)
  - SMS (optional, for critical alerts)

- **Features:**
  - Real-time notifications via WebSocket
  - Notification history and archive
  - Notification preferences (customize by type)
  - Notification scheduling (quiet hours)

**UI Components:**
- Notification bell icon with unread count
- Notification dropdown/sidebar
- Notification preferences modal
- Toast notifications for real-time updates

---

### 10. **Assignment, Seminar & Project Management**
- **Assignment Management:**
  - Create assignments with deadline
  - Attach resources and instructions
  - Set rubric for grading
  - Student submission portal
  - Automatic deadline tracking
  - Late submission handling

- **Student Features:**
  - View assignments and deadlines
  - Download assignment materials
  - Submit assignments (file upload)
  - View grades and feedback
  - Resubmit if allowed

- **Teacher Features:**
  - Create and publish assignments
  - View submissions in dashboard
  - Grade assignments with rubric
  - Add feedback and comments
  - Bulk download submissions
  - Send grade notifications

- **Seminar & Project Management:**
  - Create seminars/projects with teams
  - Team formation interface
  - Milestone tracking
  - Progress reporting
  - Presentation scheduling

**UI Components:**
- Assignment list with filters
- Assignment detail page with submission form
- Grading interface with rubric
- Submission history timeline
- Plagiarism report integration

---

### 11. **Exam Management & Scheduling**
- **Features:**
  - Create and schedule exams
  - Dynamic seating arrangement (avoid friends, load-balance)
  - Exam hall allocation
  - Generate admit cards with QR codes
  - Invigilator assignment
  - Exam result publication

- **Student Features:**
  - View exam schedule
  - Check seating arrangement
  - Download admit card
  - View exam center details
  - View results after publication

- **Admin/Faculty Features:**
  - Create exam structure
  - Set exam rules and regulations
  - Generate seating arrangements
  - Publish results with security
  - Generate exam statistics

**UI Components:**
- Exam calendar view
- Seating arrangement visualization (grid)
- Admit card PDF download
- Exam result dashboard
- Exam analytics charts

---

### 12. **Progress Report & Analytics**
- **Student Dashboard:**
  - Overall GPA and performance metrics
  - Course-wise grades and progress
  - Attendance summary
  - Assignment submission status
  - Improvement areas identified
  - Grade trends (line chart)
  - Performance comparison with class average (anonymous)

- **Teacher Dashboard:**
  - Class performance statistics
  - Student-wise progress tracking
  - Assignment submission analytics
  - Attendance trends
  - Identify struggling students
  - Class performance comparison

- **Admin Dashboard:**
  - Institutional metrics (enrollment, retention, etc.)
  - Department-wise performance
  - Student success metrics
  - Financial overview
  - System usage analytics

**UI Components:**
- Performance dashboard with KPIs
- Grade trend charts
- Attendance heatmap
- Student performance radar chart
- Progress timeline

---

### 13. **Professor/Faculty Directory**
- **Directory Features:**
  - Search faculty by name, department, expertise
  - View faculty profiles with:
    - Bio and qualifications
    - Office hours and location
    - Contact information
    - Courses taught
    - Research areas
    - Office photos

- **Interaction:**
  - Schedule office hours appointment
  - Send message to professor
  - View professor's availability
  - Rate and review professors

**UI Components:**
- Faculty grid/list view with filters
- Faculty profile page
- Appointment booking calendar
- Messaging interface
- Rating and review section

---

### 14. **Support & Help System**
- **Support Ticket System:**
  - Create support tickets with category
  - Track ticket status (Open, In-Progress, Resolved, Closed)
  - Attach screenshots/documents
  - View ticket history

- **Support Features:**
  - Knowledge base (FAQ)
  - Video tutorials library
  - Live chat support (when available)
  - Email support
  - Community forum (peer help)

- **Admin Features:**
  - View all support tickets
  - Assign tickets to support staff
  - Add responses and updates
  - Close tickets
  - Track response time metrics

**UI Components:**
- Support ticket form
- Ticket list with status filters
- Knowledge base search
- Live chat widget
- Support dashboard

---

## 🎨 UI/UX REQUIREMENTS

### 1. **Theme System**
- **Dark Theme (Default):**
  - Background: `#0a0e27` (Deep Navy)
  - Card Background: `#1a1f3a`
  - Text Primary: `#f5f5f5`
  - Text Secondary: `#a0a0a0`
  - Accent: `#3b82f6` (Bright Blue)
  - Success: `#10b981` (Green)
  - Warning: `#f59e0b` (Amber)
  - Error: `#ef4444` (Red)

- **Light Theme:**
  - Background: `#f8fafc`
  - Card Background: `#ffffff`
  - Text Primary: `#1f2937`
  - Text Secondary: `#6b7280`
  - Accent: `#2563eb` (Blue)
  - Success: `#059669` (Green)
  - Warning: `#d97706` (Amber)
  - Error: `#dc2626` (Red)

- **Theme Toggle:**
  - Located in header/navigation
  - Smooth transition between themes
  - Persist user preference in localStorage
  - System preference detection as fallback

### 2. **Typography**
- **Font Family:** Poppins (Google Fonts)
- **Font Weights Used:**
  - Regular: 400
  - Medium: 500
  - Semibold: 600
  - Bold: 700

- **Font Sizes:**
  - H1: 32px (Bold)
  - H2: 28px (Semibold)
  - H3: 24px (Semibold)
  - H4: 20px (Semibold)
  - Body: 16px (Regular)
  - Small: 14px (Regular)
  - Tiny: 12px (Regular)

### 3. **Logo & Branding**
- **Logo:** Embedded in header (left-aligned)
- **Logo Usage:**
  - Full logo on desktop
  - Icon-only on mobile
  - Light version for dark theme
  - Dark version for light theme
- **Logo Placement:**
  - Navigation bar (top-left)
  - Login page (center-top)
  - Footer (optional, centered)

### 4. **Modern Design Style**
- **Design System:**
  - Minimalist aesthetic with generous whitespace
  - Rounded corners (8px, 12px, 16px radius)
  - Subtle shadows for depth
  - Consistent spacing using 8px grid
  - Icons from Heroicons or Feather Icons

- **Components:**
  - Glassmorphism cards (optional, for hero sections)
  - Gradient accents (subtle)
  - Micro-interactions (hover, click feedback)
  - Smooth animations and transitions
  - Responsive grid layouts

- **Visual Hierarchy:**
  - Clear primary/secondary/tertiary actions
  - Consistent button styling
  - Card-based layouts
  - Color-coded alerts and status indicators

### 5. **Typography & Spacing**
- **Heading Hierarchy:**
  ```
  H1: Page titles
  H2: Section titles
  H3: Subsection titles
  H4: Card titles
  Body: Regular text content
  Small: Metadata, timestamps, captions
  ```

- **Spacing Scale (8px grid):**
  ```
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  ```

---

## 🏗️ NEXT.JS ARCHITECTURE

### 1. **Project Structure**
```
arivolam-app/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx             # Dashboard layout with sidebar
│   │   ├── page.tsx               # Dashboard home
│   │   ├── attendance/page.tsx
│   │   ├── library/page.tsx
│   │   ├── navigation/page.tsx
│   │   ├── fees/page.tsx
│   │   ├── assignments/page.tsx
│   │   ├── exams/page.tsx
│   │   ├── progress/page.tsx
│   │   ├── professors/page.tsx
│   │   ├── support/page.tsx
│   │   ├── discussions/page.tsx
│   │   ├── video-calls/page.tsx
│   │   └── notifications/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts
│   │   │   ├── register/route.ts
│   │   │   └── logout/route.ts
│   │   ├── attendance/route.ts
│   │   ├── library/route.ts
│   │   ├── fees/route.ts
│   │   ├── assignments/route.ts
│   │   ├── exams/route.ts
│   │   ├── progress/route.ts
│   │   └── notifications/route.ts
│   └── error.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── common/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   ├── NotificationBell.tsx
│   │   └── ThemeToggle.tsx
│   ├── forms/
│   │   ├── LoginForm.tsx
│   │   ├── AssignmentForm.tsx
│   │   └── SupportTicketForm.tsx
│   ├── dashboard/
│   │   ├── StatsCard.tsx
│   │   ├── GradeChart.tsx
│   │   └── AttendanceHeatmap.tsx
│   └── features/
│       ├── AttendanceTracker.tsx
│       ├── LibrarySearch.tsx
│       ├── NavigationMap.tsx
│       ├── VideoConference.tsx
│       ├── DiscussionForum.tsx
│       └── FeePayment.tsx
├── lib/
│   ├── api.ts                    # API client
│   ├── auth.ts                   # Auth utilities
│   ├── constants.ts              # App constants
│   └── utils.ts                  # Helper functions
├── hooks/
│   ├── useAuth.ts
│   ├── useTheme.ts
│   ├── useNotifications.ts
│   └── useFetch.ts
├── context/
│   ├── AuthContext.tsx
│   ├── ThemeContext.tsx
│   └── NotificationContext.tsx
├── styles/
│   ├── globals.css
│   ├── variables.css              # CSS custom properties
│   └── animations.css
├── public/
│   ├── logo.png
│   ├── logo-dark.png
│   └── icons/
├── .env.local
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### 2. **Key Technologies & Libraries**
```
Core:
  - Next.js 14+ (App Router)
  - React 18+
  - TypeScript

Styling:
  - Tailwind CSS
  - CSS Modules (for component scoping)

State Management:
  - Zustand or Jotai (lightweight)
  - Context API (for auth, theme)

API & Data Fetching:
  - Axios or Fetch API
  - SWR or React Query (caching)

Forms:
  - React Hook Form
  - Zod (validation)

UI Components:
  - Shadcn/ui or Headless UI
  - Heroicons (icons)
  - Recharts (charts and graphs)

Authentication:
  - JWT (with refresh tokens)
  - NextAuth.js (optional)

Video Conferencing:
  - Jitsi Meet IFrame API

Maps:
  - Leaflet.js (for campus maps)

Notifications:
  - Socket.io (real-time)
  - Toast notifications (React Toastify)

Development:
  - ESLint
  - Prettier
  - Husky (pre-commit hooks)
```

### 3. **Environment Variables**
```
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=Arivolam
NEXT_PUBLIC_JITSI_URL=https://meet.jitsi.org
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

DATABASE_URL=postgresql://user:password@localhost:5432/arivolam
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/arivolam

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret

OPENAI_API_KEY=your_openai_api_key
```

---

## 📱 Responsive Design

### Breakpoints:
- **Mobile:** 320px - 640px
- **Tablet:** 641px - 1024px
- **Desktop:** 1025px+

### Mobile-First Approach:
- Design for mobile first, then enhance for larger screens
- Touch-friendly buttons (minimum 44px)
- Full-width on mobile, max-width containers on desktop
- Hamburger menu on mobile, full sidebar on desktop
- Stack layout on mobile, grid on desktop

---

## 🔐 Security & Best Practices

1. **Authentication:**
   - Secure JWT tokens with httpOnly cookies
   - Refresh token rotation
   - CORS configuration
   - Rate limiting on auth endpoints

2. **Data Protection:**
   - Environment variables for sensitive data
   - Input validation and sanitization
   - XSS protection (Content Security Policy)
   - CSRF protection with tokens

3. **API Security:**
   - Rate limiting per user/IP
   - Request validation with Zod
   - Error handling without exposing sensitive info
   - API versioning (/api/v1/)

4. **Frontend Security:**
   - Content Security Policy headers
   - X-Frame-Options header
   - X-Content-Type-Options: nosniff
   - Secure HTTP headers with next-secure-headers

---

## 🚀 Deployment

### Hosting Options:
- **Vercel** (Recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Self-hosted on AWS EC2**

### CI/CD Pipeline:
- GitHub Actions for automated testing
- Automatic deployment on push to main
- Staging environment for testing

---

## 📋 Footer & Branding

**Footer Content:**
```
Copyright © 2025 Arivolam - Campus Unified Platform
Developed by: [Team Name] | SAFI Institute, Vazhayur
Powered by: NavarMP.Digibayt.com
Privacy Policy | Terms of Service | Contact Us
```

**Footer Style:**
- Dark background (matching header)
- Light text
- Links with hover effects
- Centered on mobile, spread on desktop
- Sticky or floating option

---

## ✅ Development Checklist

- [ ] Setup Next.js project with TypeScript
- [ ] Configure Tailwind CSS with custom theme
- [ ] Create authentication system (login, register, logout)
- [ ] Setup API routes (backend endpoints)
- [ ] Create reusable UI components
- [ ] Implement theme switching (dark/light)
- [ ] Setup state management (Auth, Notifications, Theme)
- [ ] Implement each feature module
- [ ] Add real-time notifications (WebSocket)
- [ ] Integrate video conferencing (Jitsi)
- [ ] Setup responsive design
- [ ] Add form validation
- [ ] Implement error handling and loading states
- [ ] Add SEO optimization
- [ ] Setup logging and monitoring
- [ ] Write unit tests
- [ ] Perform security audit
- [ ] Optimize performance (images, code splitting)
- [ ] Setup CI/CD pipeline
- [ ] Deploy to production
- [ ] Monitor and maintain

---

## 🎯 Success Metrics

- [ ] All 14 features fully functional
- [ ] Fast loading time (<2s on 4G)
- [ ] Mobile-responsive on all devices
- [ ] 90+ Lighthouse score
- [ ] 80%+ test coverage
- [ ] Zero critical security vulnerabilities
- [ ] Smooth animations and transitions
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Professional, polished UI
- [ ] Ready for production deployment

---

## 📞 Support & Contact

**Development Support:**
- GitHub Issues for bug reports
- Email: support@arivolam.app
- Discord/Slack community

**Deployment Support:**
- Vercel deployment documentation
- Next.js official documentation
- Tailwind CSS documentation

---

## 📄 Additional Notes

1. **Database:** Backend API should be developed separately (Node.js/Express recommended)
2. **Real-time Features:** Implement WebSocket connection for notifications and live updates
3. **Performance:** Use Next.js Image optimization, dynamic imports, and code splitting
4. **Accessibility:** Follow WCAG 2.1 guidelines throughout development
5. **Testing:** Implement Jest for unit tests, Cypress for E2E tests
6. **Documentation:** Keep README updated with setup instructions
7. **Version Control:** Use semantic versioning (v1.0.0, v1.1.0, etc.)

---

*This prompt is ready to be provided to AI code generation tools (GitHub Copilot, Claude, ChatGPT, etc.) or to your development team.*

*Generated: December 4, 2025*  
*Project: Arivolam - Campus Unified Platform*  
*Institution: SAFI Institute, Vazhayur*