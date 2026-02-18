-- =====================================================
-- 04_navigation_schema.sql
-- Campus navigation: buildings, rooms, POIs, paths,
-- floor plans, walkable graph for pathfinding
-- =====================================================

-- ─── Campus Buildings ───
create table if not exists public.campus_buildings (
    id           uuid primary key default gen_random_uuid(),
    institution_id uuid not null references public.institutions(id) on delete cascade,
    name         text not null,
    short_name   text,
    description  text,
    category     text not null default 'academic'
                   check (category in ('academic','administrative','hostel','facility','recreation','religious','parking')),
    floors       int not null default 1,
    -- GeoJSON polygon for building outline
    geo_polygon  jsonb,
    -- center point for marker
    latitude     double precision not null,
    longitude    double precision not null,
    -- SVG element ID if a campus SVG overlay exists
    svg_element_id text,
    icon         text default 'building',
    color        text default '#3b82f6',
    operating_hours text,
    image_url    text,
    sort_order   int default 0,
    is_active    boolean default true,
    created_at   timestamptz default now()
);

-- ─── Floor Plans ───
create table if not exists public.campus_floors (
    id           uuid primary key default gen_random_uuid(),
    building_id  uuid not null references public.campus_buildings(id) on delete cascade,
    floor_number int not null default 0,
    floor_label  text not null, -- "Ground Floor", "1st Floor", etc.
    svg_data     text,          -- inline SVG for floor plan
    image_url    text,          -- or image URL
    width_px     int,
    height_px    int,
    created_at   timestamptz default now(),
    unique(building_id, floor_number)
);

-- ─── Campus Rooms ───
create table if not exists public.campus_rooms (
    id           uuid primary key default gen_random_uuid(),
    building_id  uuid not null references public.campus_buildings(id) on delete cascade,
    floor_id     uuid references public.campus_floors(id) on delete set null,
    name         text not null,
    room_number  text,
    room_type    text not null default 'classroom'
                   check (room_type in ('classroom','lab','office','library','auditorium',
                          'seminar_hall','restroom','canteen','prayer_room','storeroom',
                          'conference','common_area','other')),
    capacity     int,
    description  text,
    -- position within building/floor for indoor nav
    x_offset     double precision,
    y_offset     double precision,
    -- global coords (for outdoor routing)
    latitude     double precision,
    longitude    double precision,
    svg_element_id text,
    is_accessible  boolean default true,
    is_active      boolean default true,
    created_at     timestamptz default now()
);

-- ─── Points of Interest ───
create table if not exists public.campus_pois (
    id           uuid primary key default gen_random_uuid(),
    institution_id uuid not null references public.institutions(id) on delete cascade,
    name         text not null,
    category     text not null default 'amenity'
                   check (category in ('amenity','food','transport','health','sports',
                          'parking','atm','entrance','emergency','other')),
    description  text,
    icon         text default 'map-pin',
    latitude     double precision not null,
    longitude    double precision not null,
    -- optional link to a building or room
    building_id  uuid references public.campus_buildings(id) on delete set null,
    room_id      uuid references public.campus_rooms(id) on delete set null,
    operating_hours text,
    image_url    text,
    is_active    boolean default true,
    created_at   timestamptz default now()
);

-- ─── Navigation Path Graph (nodes + edges for A*) ───
create table if not exists public.campus_nav_nodes (
    id           uuid primary key default gen_random_uuid(),
    institution_id uuid not null references public.institutions(id) on delete cascade,
    latitude     double precision not null,
    longitude    double precision not null,
    node_type    text default 'waypoint'
                   check (node_type in ('waypoint','entrance','junction','staircase',
                          'elevator','door','poi')),
    -- optional link to a building entrance
    building_id  uuid references public.campus_buildings(id) on delete set null,
    room_id      uuid references public.campus_rooms(id) on delete set null,
    floor_number int default 0,
    label        text,
    is_indoor    boolean default false
);

create table if not exists public.campus_nav_edges (
    id           uuid primary key default gen_random_uuid(),
    from_node_id uuid not null references public.campus_nav_nodes(id) on delete cascade,
    to_node_id   uuid not null references public.campus_nav_nodes(id) on delete cascade,
    weight       double precision not null default 1.0, -- distance in meters
    edge_type    text default 'walkway'
                   check (edge_type in ('walkway','corridor','staircase','elevator','bridge','road')),
    is_accessible boolean default true,
    is_covered    boolean default false
);

-- ─── Indexes ───
create index if not exists idx_buildings_institution on public.campus_buildings(institution_id);
create index if not exists idx_rooms_building on public.campus_rooms(building_id);
create index if not exists idx_pois_institution on public.campus_pois(institution_id);
create index if not exists idx_nav_nodes_institution on public.campus_nav_nodes(institution_id);
create index if not exists idx_nav_edges_from on public.campus_nav_edges(from_node_id);
create index if not exists idx_nav_edges_to on public.campus_nav_edges(to_node_id);

-- ─── RLS ───
alter table public.campus_buildings enable row level security;
alter table public.campus_floors enable row level security;
alter table public.campus_rooms enable row level security;
alter table public.campus_pois enable row level security;
alter table public.campus_nav_nodes enable row level security;
alter table public.campus_nav_edges enable row level security;

-- Read access for anyone (campus maps are public info)
create policy "Campus buildings are publicly readable"
    on public.campus_buildings for select using (true);
create policy "Campus floors are publicly readable"
    on public.campus_floors for select using (true);
create policy "Campus rooms are publicly readable"
    on public.campus_rooms for select using (true);
create policy "Campus POIs are publicly readable"
    on public.campus_pois for select using (true);
create policy "Nav nodes are publicly readable"
    on public.campus_nav_nodes for select using (true);
create policy "Nav edges are publicly readable"
    on public.campus_nav_edges for select using (true);

-- ─── Seed SIAS Campus Data ───
-- Use the institution ID from migration 02
do $$
declare
    sias_id uuid;
    main_block_id uuid;
    science_block_id uuid;
    library_id uuid;
    mens_hostel_id uuid;
    admin_block_id uuid;
    mosque_id uuid;
    canteen_id uuid;
    sports_id uuid;
begin
    select id into sias_id from public.institutions where slug = 'safi-institute' limit 1;
    if sias_id is null then
        raise notice 'SIAS institution not found, skipping seed';
        return;
    end if;

    -- ── Buildings ──
    -- Real SIAS coordinates ≈ 11.2274°N, 75.9104°E (Vazhayur, Malappuram)
    insert into public.campus_buildings (id, institution_id, name, short_name, category, floors, latitude, longitude, description, icon, color, operating_hours, sort_order)
    values
        (gen_random_uuid(), sias_id, 'Main Academic Block', 'Main Block', 'academic', 3,
         11.22755, 75.91050, 'Primary academic building with CS, BCA, Commerce departments.', 'school', '#3b82f6', '8:30 AM - 5:00 PM', 1),
        (gen_random_uuid(), sias_id, 'Science Block', 'Sci Block', 'academic', 2,
         11.22770, 75.91080, 'Physics, Chemistry, Biology labs and seminar halls.', 'flask-conical', '#8b5cf6', '8:30 AM - 5:00 PM', 2),
        (gen_random_uuid(), sias_id, 'Central Library', 'Library', 'facility', 2,
         11.22730, 75.91060, 'Library with reading room, digital section, and archives.', 'library', '#f59e0b', '8:00 AM - 8:00 PM', 3),
        (gen_random_uuid(), sias_id, 'Administrative Block', 'Admin', 'administrative', 2,
         11.22745, 75.91030, 'Principal office, administration, accounts, and exam section.', 'building-2', '#ef4444', '9:00 AM - 4:30 PM', 4),
        (gen_random_uuid(), sias_id, 'Men''s Hostel', 'Hostel', 'hostel', 3,
         11.22710, 75.91100, 'Residential block for male students.', 'bed-double', '#06b6d4', '24/7', 5),
        (gen_random_uuid(), sias_id, 'Masjid', 'Mosque', 'religious', 1,
         11.22760, 75.91020, 'Campus mosque for daily prayers.', 'moon', '#059669', 'Open for prayer times', 6),
        (gen_random_uuid(), sias_id, 'Canteen & Mess', 'Canteen', 'facility', 1,
         11.22720, 75.91040, 'Main dining hall and snack counter.', 'utensils', '#d97706', '7:00 AM - 9:00 PM', 7),
        (gen_random_uuid(), sias_id, 'Sports Ground', 'Ground', 'recreation', 1,
         11.22790, 75.91070, 'Football pitch, volleyball court, and jogging track.', 'trophy', '#16a34a', '6:00 AM - 7:00 PM', 8)
    returning id into main_block_id; -- only gets last inserted, but we'll query by name below

    -- Get building IDs for POIs
    select id into main_block_id from public.campus_buildings where institution_id = sias_id and short_name = 'Main Block' limit 1;
    select id into library_id from public.campus_buildings where institution_id = sias_id and short_name = 'Library' limit 1;
    select id into canteen_id from public.campus_buildings where institution_id = sias_id and short_name = 'Canteen' limit 1;

    -- ── Points of Interest ──
    insert into public.campus_pois (institution_id, name, category, latitude, longitude, description, icon, building_id)
    values
        (sias_id, 'Main Entrance', 'entrance', 11.22700, 75.91040, 'Main campus gate from the road', 'log-in', null),
        (sias_id, 'Parking Area', 'parking', 11.22695, 75.91060, 'Two-wheeler and four-wheeler parking', 'car', null),
        (sias_id, 'ATM (SBI)', 'atm', 11.22740, 75.91025, 'SBI ATM near admin block', 'landmark', null),
        (sias_id, 'Water Cooler (Main Block)', 'amenity', 11.22755, 75.91055, 'Drinking water station', 'droplets', main_block_id),
        (sias_id, 'Wi-Fi Zone', 'amenity', 11.22750, 75.91048, 'Free Wi-Fi hotspot area', 'wifi', null),
        (sias_id, 'First Aid Room', 'health', 11.22748, 75.91035, 'Health and first aid center', 'heart-pulse', null),
        (sias_id, 'Snack Counter', 'food', 11.22722, 75.91042, 'Tea, snacks, and juice counter', 'coffee', canteen_id),
        (sias_id, 'Shuttle Stop', 'transport', 11.22698, 75.91035, 'Bus and auto stop near main gate', 'bus', null);

    -- ── Sample Rooms for Main Block ──
    insert into public.campus_rooms (building_id, name, room_number, room_type, capacity, description, latitude, longitude)
    values
        (main_block_id, 'BCA Hall', '101', 'classroom', 60, 'BCA lecture hall, ground floor', 11.22752, 75.91045),
        (main_block_id, 'Computer Lab 1', '102', 'lab', 40, 'Main CS lab with 40 systems', 11.22754, 75.91052),
        (main_block_id, 'Computer Lab 2', '103', 'lab', 30, 'Secondary lab for web programming', 11.22756, 75.91055),
        (main_block_id, 'Seminar Hall', '201', 'seminar_hall', 120, 'Large seminar hall, 1st floor', 11.22755, 75.91048),
        (main_block_id, 'HOD Office (CS)', '202', 'office', 4, 'Head of Department office', 11.22757, 75.91050),
        (main_block_id, 'Staff Room', '203', 'office', 15, 'Faculty common room', 11.22753, 75.91047);

    -- ── Sample Rooms for Library ──
    insert into public.campus_rooms (building_id, name, room_number, room_type, capacity, description, latitude, longitude)
    values
        (library_id, 'Reading Room', 'G01', 'library', 80, 'Quiet reading area', 11.22728, 75.91058),
        (library_id, 'Digital Section', 'G02', 'lab', 20, 'Online resources and e-journals', 11.22732, 75.91062),
        (library_id, 'Reference Section', '101', 'library', 30, 'Reference books, encyclopedias', 11.22730, 75.91058);

    -- ── Navigation Nodes ──
    -- Create waypoints for basic outdoor routing
    declare
        n_entrance uuid;
        n_parking uuid;
        n_junction1 uuid;
        n_junction2 uuid;
        n_junction3 uuid;
        n_main uuid;
        n_admin uuid;
        n_library uuid;
        n_canteen uuid;
        n_science uuid;
        n_hostel uuid;
        n_mosque uuid;
        n_sports uuid;
    begin
        insert into public.campus_nav_nodes (institution_id, latitude, longitude, node_type, label) values (sias_id, 11.22700, 75.91040, 'entrance', 'Main Gate') returning id into n_entrance;
        insert into public.campus_nav_nodes (institution_id, latitude, longitude, node_type, label) values (sias_id, 11.22695, 75.91060, 'waypoint', 'Parking') returning id into n_parking;
        insert into public.campus_nav_nodes (institution_id, latitude, longitude, node_type, label) values (sias_id, 11.22720, 75.91045, 'junction', 'Main Junction') returning id into n_junction1;
        insert into public.campus_nav_nodes (institution_id, latitude, longitude, node_type, label) values (sias_id, 11.22745, 75.91050, 'junction', 'Central Junction') returning id into n_junction2;
        insert into public.campus_nav_nodes (institution_id, latitude, longitude, node_type, label) values (sias_id, 11.22770, 75.91060, 'junction', 'North Junction') returning id into n_junction3;
        insert into public.campus_nav_nodes (institution_id, latitude, longitude, node_type, label, building_id) values (sias_id, 11.22755, 75.91050, 'entrance', 'Main Block Entrance', main_block_id) returning id into n_main;
        insert into public.campus_nav_nodes (institution_id, latitude, longitude, node_type, label) values (sias_id, 11.22745, 75.91030, 'entrance', 'Admin Entrance') returning id into n_admin;
        insert into public.campus_nav_nodes (institution_id, latitude, longitude, node_type, label, building_id) values (sias_id, 11.22730, 75.91060, 'entrance', 'Library Entrance', library_id) returning id into n_library;
        insert into public.campus_nav_nodes (institution_id, latitude, longitude, node_type, label, building_id) values (sias_id, 11.22720, 75.91040, 'entrance', 'Canteen Entrance', canteen_id) returning id into n_canteen;
        insert into public.campus_nav_nodes (institution_id, latitude, longitude, node_type, label) values (sias_id, 11.22770, 75.91080, 'entrance', 'Science Block Entrance') returning id into n_science;
        insert into public.campus_nav_nodes (institution_id, latitude, longitude, node_type, label) values (sias_id, 11.22710, 75.91100, 'entrance', 'Hostel Entrance') returning id into n_hostel;
        insert into public.campus_nav_nodes (institution_id, latitude, longitude, node_type, label) values (sias_id, 11.22760, 75.91020, 'entrance', 'Mosque Entrance') returning id into n_mosque;
        insert into public.campus_nav_nodes (institution_id, latitude, longitude, node_type, label) values (sias_id, 11.22790, 75.91070, 'entrance', 'Sports Ground') returning id into n_sports;

        -- Edges (bidirectional — insert both directions)
        -- Entrance → Main Junction
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_entrance, n_junction1, 25, 'road');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_junction1, n_entrance, 25, 'road');
        -- Entrance → Parking
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_entrance, n_parking, 30, 'road');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_parking, n_entrance, 30, 'road');
        -- Main Junction → Central Junction
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_junction1, n_junction2, 30, 'walkway');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_junction2, n_junction1, 30, 'walkway');
        -- Central → North
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_junction2, n_junction3, 30, 'walkway');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_junction3, n_junction2, 30, 'walkway');
        -- Junction links to buildings
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_junction1, n_canteen, 10, 'walkway');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_canteen, n_junction1, 10, 'walkway');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_junction2, n_main, 15, 'walkway');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_main, n_junction2, 15, 'walkway');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_junction2, n_admin, 20, 'walkway');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_admin, n_junction2, 20, 'walkway');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_junction2, n_library, 20, 'walkway');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_library, n_junction2, 20, 'walkway');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_junction2, n_mosque, 25, 'walkway');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_mosque, n_junction2, 25, 'walkway');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_junction3, n_science, 15, 'walkway');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_science, n_junction3, 15, 'walkway');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_junction3, n_sports, 25, 'walkway');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_sports, n_junction3, 25, 'walkway');
        -- Library → Hostel connection
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_library, n_hostel, 50, 'walkway');
        insert into public.campus_nav_edges (from_node_id, to_node_id, weight, edge_type) values (n_hostel, n_library, 50, 'walkway');
    end;
end $$;
