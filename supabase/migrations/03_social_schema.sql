-- =====================================================
-- 03_social_schema.sql
-- Social feed tables: posts, reactions, comments,
-- saves, follows, hashtags
-- =====================================================

-- ─── Posts ───
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references auth.users on delete cascade not null,
  institution_id uuid references public.institutions on delete set null, -- null = platform-level post
  
  content text not null,
  
  -- Media (stored as JSONB array: [{url, type, alt}])
  media jsonb default '[]'::jsonb,
  
  -- Post type
  type text default 'post' check (type in ('post', 'article', 'project', 'event', 'announcement')),
  
  -- Engagement counts (denormalized)
  reactions_count integer default 0,
  comments_count integer default 0,
  shares_count integer default 0,
  saves_count integer default 0,
  
  -- Visibility
  visibility text default 'public' check (visibility in ('public', 'institution', 'connections')),
  is_pinned boolean default false,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─── Post Reactions (LinkedIn-style) ───
create table if not exists public.post_reactions (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  
  reaction_type text not null check (reaction_type in ('like', 'celebrate', 'love', 'insightful', 'support')),
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(post_id, user_id) -- One reaction per user per post
);

-- ─── Comments ───
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts on delete cascade not null,
  author_id uuid references auth.users on delete cascade not null,
  parent_id uuid references public.comments on delete cascade, -- for nested replies
  
  content text not null,
  
  reactions_count integer default 0,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─── Saves / Bookmarks ───
create table if not exists public.saves (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(post_id, user_id)
);

-- ─── Follows ───
create table if not exists public.follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references auth.users on delete cascade not null,
  following_id uuid references auth.users on delete cascade not null,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(follower_id, following_id),
  check (follower_id != following_id) -- Can't follow yourself
);

-- ─── Hashtags ───
create table if not exists public.hashtags (
  id uuid default gen_random_uuid() primary key,
  name text not null unique, -- lowercase, no #
  posts_count integer default 0,
  
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ─── Post-Hashtag junction ───
create table if not exists public.post_hashtags (
  post_id uuid references public.posts on delete cascade not null,
  hashtag_id uuid references public.hashtags on delete cascade not null,
  primary key (post_id, hashtag_id)
);

-- =====================================================
-- Row Level Security
-- =====================================================

alter table public.posts enable row level security;
alter table public.post_reactions enable row level security;
alter table public.comments enable row level security;
alter table public.saves enable row level security;
alter table public.follows enable row level security;
alter table public.hashtags enable row level security;
alter table public.post_hashtags enable row level security;

-- Posts: public posts visible to all, institution posts to members
create policy "Public posts are viewable by everyone"
  on public.posts for select using (visibility = 'public');

create policy "Users can create posts"
  on public.posts for insert with check (auth.uid() = author_id);

create policy "Users can update own posts"
  on public.posts for update using (auth.uid() = author_id);

create policy "Users can delete own posts"
  on public.posts for delete using (auth.uid() = author_id);

-- Reactions
create policy "Reactions are viewable by everyone"
  on public.post_reactions for select using (true);

create policy "Users can manage own reactions"
  on public.post_reactions for insert with check (auth.uid() = user_id);

create policy "Users can delete own reactions"
  on public.post_reactions for delete using (auth.uid() = user_id);

-- Comments
create policy "Comments are viewable by everyone"
  on public.comments for select using (true);

create policy "Users can create comments"
  on public.comments for insert with check (auth.uid() = author_id);

create policy "Users can update own comments"
  on public.comments for update using (auth.uid() = author_id);

create policy "Users can delete own comments"
  on public.comments for delete using (auth.uid() = author_id);

-- Saves
create policy "Users can view own saves"
  on public.saves for select using (auth.uid() = user_id);

create policy "Users can manage own saves"
  on public.saves for insert with check (auth.uid() = user_id);

create policy "Users can delete own saves"
  on public.saves for delete using (auth.uid() = user_id);

-- Follows
create policy "Follows are viewable by everyone"
  on public.follows for select using (true);

create policy "Users can follow"
  on public.follows for insert with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on public.follows for delete using (auth.uid() = follower_id);

-- Hashtags are public
create policy "Hashtags are viewable by everyone"
  on public.hashtags for select using (true);

create policy "Post hashtags are viewable by everyone"
  on public.post_hashtags for select using (true);

-- =====================================================
-- Triggers for denormalized counts
-- =====================================================

-- Update reactions_count on posts
create or replace function public.update_post_reactions_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set reactions_count = reactions_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set reactions_count = reactions_count - 1 where id = OLD.post_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger on_reaction_change
  after insert or delete on public.post_reactions
  for each row execute procedure public.update_post_reactions_count();

-- Update comments_count on posts
create or replace function public.update_post_comments_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set comments_count = comments_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set comments_count = comments_count - 1 where id = OLD.post_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute procedure public.update_post_comments_count();

-- Update saves_count on posts
create or replace function public.update_post_saves_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.posts set saves_count = saves_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update public.posts set saves_count = saves_count - 1 where id = OLD.post_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger on_save_change
  after insert or delete on public.saves
  for each row execute procedure public.update_post_saves_count();

-- Update followers/following count on arivolam_profiles
create or replace function public.update_follow_counts()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.arivolam_profiles set following_count = following_count + 1 where id = NEW.follower_id;
    update public.arivolam_profiles set followers_count = followers_count + 1 where id = NEW.following_id;
  elsif TG_OP = 'DELETE' then
    update public.arivolam_profiles set following_count = following_count - 1 where id = OLD.follower_id;
    update public.arivolam_profiles set followers_count = followers_count - 1 where id = OLD.following_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger on_follow_change
  after insert or delete on public.follows
  for each row execute procedure public.update_follow_counts();

-- Update posts_count on arivolam_profiles
create or replace function public.update_profile_posts_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.arivolam_profiles set posts_count = posts_count + 1 where id = NEW.author_id;
  elsif TG_OP = 'DELETE' then
    update public.arivolam_profiles set posts_count = posts_count - 1 where id = OLD.author_id;
  end if;
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

create trigger on_post_change
  after insert or delete on public.posts
  for each row execute procedure public.update_profile_posts_count();

-- Updated_at triggers for posts and comments
create trigger posts_updated_at
  before update on public.posts
  for each row execute procedure public.update_updated_at();

create trigger comments_updated_at
  before update on public.comments
  for each row execute procedure public.update_updated_at();

-- =====================================================
-- Indexes
-- =====================================================
create index if not exists idx_posts_author on public.posts(author_id);
create index if not exists idx_posts_institution on public.posts(institution_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_post_reactions_post on public.post_reactions(post_id);
create index if not exists idx_comments_post on public.comments(post_id);
create index if not exists idx_follows_follower on public.follows(follower_id);
create index if not exists idx_follows_following on public.follows(following_id);
