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


