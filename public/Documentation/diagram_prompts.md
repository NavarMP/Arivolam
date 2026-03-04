# DFD Level 0

```text
Create a Data Flow Diagram Level 0 (Context Diagram) for a Multi-tenant Campus ERP System called Campusolam.

Tech stack: Next.js (frontend + API routes), Supabase (single PostgreSQL database, Storage, and Authentication).

Architecture Context:
The system is multi-tenant. Institutions have their own subset of the system accessible via their unique URL parameter `/{slug}`. 
- `dev-admin` users access the global system at `/dev-admin`.
- Normal users (admin, faculty, student) interact with the system scoped to their institution at `/{slug}/*`.

External entities:
- Dev Admin (highest privilege, global system-level access)
- Admin (institutional administrator, scoped to distinct `{slug}`)
- Faculty (educator, scoped to distinct `{slug}`)
- Student (learner, scoped to distinct `{slug}`)
- Public User (unauthenticated visitor accessing Map Viewer via public routes)

Single central process:
- Process 0: Campusolam Multi-tenant ERP

Data flows:
- Dev Admin → Campusolam: System configuration, Institution (`{slug}`) onboarding, User override commands, Database schema changes
- Campusolam → Dev Admin: PostgreSQL audit logs, Error traces, Full global activity data

- Admin → Campusolam: User role assignments, Department configuration, Institutional announcements, Campus layout generation (Map Editor limits)
- Campusolam → Admin: User lists, Enrollment summaries, Activity reports, Interactive Map previews

- Faculty → Campusolam: Course data, Study materials, Assignment details, Grades
- Campusolam → Faculty: Student submissions, Progress reports, Enrollment lists

- Student → Campusolam: Enrollment requests, Assignment file submissions, Login credentials, Timetable/Map queries
- Campusolam → Student: Course materials, Grades, Notifications, Assignment feedback, Interactive Campus Map

- Public User → Campusolam: Campus exploration requests, Navigation queries
- Campusolam → Public User: Public Campus Map Data (Map Viewer), Interactive building layouts

Style:
- External entities as rectangles with double left border
- Dev Admin entity at the top, visually distinct with bold or colored border to indicate highest global privilege
- Central process as a large circle or rounded rectangle labeled "0"
- Data flows as labeled directional arrows
- Arrange: Dev Admin at top, Admin at left, Faculty at bottom-left, Student at right, Public User at bottom-right
```

# DFD Level 1

```text
Create a Data Flow Diagram Level 1 for Campusolam Multi-tenant ERP built with Next.js and Supabase, decomposing the system into 8 numbered processes.

Note: All Data stores (D0-D6) represent specific tables within a single centralized PostgreSQL database, not separate databases.

External entities: Dev Admin, Admin, Faculty, Student, Public User

Processes:
- P1: Authentication & Tenant Routing
  (Supabase Auth — evaluates user role and institution `{slug}`, routes appropriately)
- P2: Dev Admin Control Panel
  (Global system config, institution creation, audit queries, schema access)
- P3: User Management
  (Admin-level CRUD on profiles table scoped to a specific institution)
- P4: Campus Navigation Engine
  (Serves Map Editor for Admin to define buildings/nodes; Map Viewer for users/public)
- P5: Course Management
  (Create, publish, enroll — reads/writes to courses and enrollments tables)
- P6: Material Management
  (Upload to Supabase Storage, write metadata to materials table)
- P7: Assignment & Grading
  (Create assignments, receive submissions, write grades)
- P8: Notification Service
  (Supabase Realtime triggered push alerts)

Data stores (Tables in single PostgreSQL database):
- D0: dev_admins table (Private schema — global access)
- D1: institutions table (Tracks valid `{slug}` identifiers)
- D2: profiles table (Linked to Supabase auth.users and institutions)
- D3: map_data tables (Edges, Nodes, Buildings tied to institutions)
- D4: courses & enrollments tables 
- D5: assignments & submissions tables
- D6: Supabase Storage buckets (materials/, submissions/, map_assets/)

Data flows:
- Dev Admin → P1: Dev admin credentials 
- Admin/Faculty/Student → P1: Tenant-specific credentials
- P1 → D0: Validate dev admin identity
- P1 → D1, D2: Validates tenant `{slug}` against institutions, reads profile role
- P1 → P2: Authenticated dev admin global session
- P1 → P3, P4, P5: Authenticated institution-scoped session (`/{slug}/*`)

- Dev Admin → P2: System config, institution creation, audit requests
- P2 → D0, D1: Write audit logs, create new institution `{slug}`
- P2 → Dev Admin: Audit trail, full table activity logs

- Admin → P3: Create or deactivate users, assign roles
- P3 → D2: Write/update profiles bound to Admin's institution
- P3 → Admin: User management confirmation

- Admin → P4: Campus layout coordinates, new buildings (Map Editor)
- P4 → D3: Insert/update map nodes and buildings
- Student/Public User → P4: Navigation route requests, building search
- D3 → P4: Retrieve optimized map vector data
- P4 → Student/Public User: Formatted Campus Map (Map Viewer)

- Faculty → P5: Course title, publish toggle
- Student → P5: Enrollment request
- P5 → D4: Insert into courses/enrollments tables
- D4 → P5: Select published courses
- P5 → Student: Enrolled course list

- Faculty → P6: Upload study material
- P6 → D6: Upload file to storage
- P6 → Student/Faculty: Material access URL

- Faculty → P7: Enter grades on submissions
- Student → P7: Upload submission file
- P7 → D6: Upload submission to storage
- P7 → D5: Insert submission rows and marks
- P7 → Student: Grade and feedback

- P7/P5 → P8: Trigger notification events
- P8 → Student/Faculty: Realtime push alerts

Style:
- Processes as circles numbered P1–P8
- Data stores as open-ended rectangles D0–D6, explicitly marked as "(Table)"
- Dev Admin at top, D0/D1 visually separated to emphasize global/tenant structure
- Ensure clear differentiation between global flows (`/dev-admin`) and tenant flows (`/{slug}`)
```

# DFD Level 2

```text
Create a Data Flow Diagram Level 2 for Process P4: Campus Navigation Engine in Campusolam ERP.
This diagram expands P4 into its internal sub-processes, focusing on the Map Editor and Map Viewer.

External entities: Admin, Student, Public User

Sub-processes:
- P4.1: Render Campus Context
  (Fetch base layout and boundaries for the specific `{slug}`)
- P4.2: Map Editor (Admin)
  (Tools to draw nodes, routes, add building metadata)
- P4.3: Pathfinding & Routing
  (Calculate shortest path between two map nodes for user navigation)
- P4.4: Map Viewer
  (Interactive display of buildings, search feature, and rendered paths)

Data stores (Tables in central PostgreSQL):
- D1: institutions table
- D3.1: buildings table (Building names, coordinates, metadata)
- D3.2: map_nodes & edges tables (Graph data for campus paths)

Data flows:
- Admin/Student/Public User → P4.1: Access map via `/{slug}/map` or Admin map editor
- D1 → P4.1: Validate `{slug}` exists
- P4.1 → P4.2: Provide editable map canvas to Admin
- P4.1 → P4.4: Provide read-only interactive canvas to Student/Public

- Admin → P4.2: Add building polygons, plot paths, define landmarks
- P4.2 → D3.1, D3.2: INSERT/UPDATE coordinates directly into tables via API
- P4.2 → Admin: Visual confirmation of saved map layout

- Student/Public User → P4.4: Search for a specific building or room
- D3.1 → P4.4: Query building metadata by name
- P4.4 → Student/Public User: Highlighted building location on canvas

- Student/Public User → P4.3: Request directions from point A to point B
- D3.2 → P4.3: Fetch graph nodes and edges for shortest path algorithm
- P4.3 → P4.4: Return computed path vector overlay
- P4.4 → Student/Public User: Rendered step-by-step path on Map Viewer

Style:
- Sub-processes as numbered circles (P4.1 to P4.4)
- Data stores (tables) at bottom
- Map Editor flows strictly restricted to Admin entity
- Pathfinding engine placed centrally connecting DB to the Map Viewer
```

# ER Diagram

```text
Create a detailed Entity Relationship (ER) Diagram for the Campusolam ERP single PostgreSQL database.

Architecture Context: Multi-tenant approach using an `institutions` table to track `{slug}` values. All tables are part of one unified database.

Tables and columns:

dev_admins (Private schema — global access)
- dev_admin_id UUID PK
- name TEXT
- email TEXT UNIQUE
- password_hash TEXT
- created_at TIMESTAMPTZ

institutions (Public schema — handles the `{slug}` routing tenant)
- id UUID PK
- slug TEXT UNIQUE NOT NULL
- name TEXT NOT NULL
- boundary_coordinates JSONB
- created_at TIMESTAMPTZ

profiles (Public schema — tied to institution)
- uid UUID PK (REFERENCES auth.users)
- institution_id UUID REFERENCES institutions(id)
- name TEXT
- email TEXT UNIQUE
- role TEXT CHECK (admin | faculty | student)
- is_active BOOLEAN

courses (Public schema)
- course_id UUID PK
- institution_id UUID REFERENCES institutions(id)
- faculty_id UUID REFERENCES profiles(uid)
- title TEXT
- description TEXT
- is_published BOOLEAN

enrollments (Public schema — junction table)
- enrollment_id UUID PK
- course_id UUID REFERENCES courses(course_id)
- student_id UUID REFERENCES profiles(uid)
- UNIQUE (course_id, student_id)

map_buildings (Public schema)
- building_id UUID PK
- institution_id UUID REFERENCES institutions(id)
- name TEXT NOT NULL
- geometry JSONB (polygon coordinates)

map_nodes (Public schema)
- node_id UUID PK
- institution_id UUID REFERENCES institutions(id)
- type TEXT (path | entrance | room)
- coordinates JSONB

assignments (Public schema)
- assignment_id UUID PK
- course_id UUID REFERENCES courses(course_id)
- title TEXT

submissions (Public schema)
- submission_id UUID PK
- assignment_id UUID REFERENCES assignments(assignment_id)
- student_id UUID REFERENCES profiles(uid)
- file_url TEXT
- marks INTEGER

Relationships:
- institutions HAS profiles — 1 to N; FK: profiles.institution_id → institutions.id
- institutions HAS courses — 1 to N; FK: courses.institution_id → institutions.id
- institutions HAS map_buildings — 1 to N; FK: map_buildings.institution_id → institutions.id
- profiles (faculty) TEACHES courses — 1 to N; FK: courses.faculty_id → profiles.uid
- profiles (student) ENROLLS IN courses — M to N via enrollments junction table
- courses HAS assignments — 1 to N; FK: assignments.course_id → courses.course_id
- assignments HAS submissions — 1 to N; FK: submissions.assignment_id → assignments.assignment_id
- profiles (student) MAKES submissions — 1 to N; FK: submissions.student_id → profiles.uid

Style:
- Use crow's foot notation for cardinality
- Clearly mark FKs and PKs
- Center `institutions` as the backbone of the multi-tenant architecture, with `profiles`, `courses`, and `map_buildings` branching off it.
- Mark `dev_admins` separately at the top in a "Private Schema" bounded box to signify they operate outside the standard `{slug}` tenant restriction.
```