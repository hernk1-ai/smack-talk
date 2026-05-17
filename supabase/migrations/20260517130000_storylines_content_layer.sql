create table if not exists public.storylines (
  id text primary key,
  slug text not null unique,
  title text not null,
  teaser text not null,
  body text not null,
  category text not null,
  related_teams text[] not null default '{}',
  related_group text null,
  image_url text null,
  video_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.storylines enable row level security;

drop policy if exists "Authenticated users can read storylines" on public.storylines;
create policy "Authenticated users can read storylines"
  on public.storylines
  for select
  to authenticated
  using (true);

alter table public.takes
  add column if not exists storyline_id text null references public.storylines(id) on delete set null;

create index if not exists takes_storyline_id_idx on public.takes(storyline_id);

insert into public.storylines (id, slug, title, teaser, body, category, related_teams, related_group, image_url, video_url, created_at)
values
  (
    'story-usa-group-d',
    'can-the-united-states-survive-group-d',
    'Can the United States survive Group D?',
    'The talent is there, but Group D looks unforgiving from match one.',
    'The United States enters Group D with real expectations and real pressure. Paraguay can punish defensive mistakes, Australia brings physical tempo, and Türkiye can control stretches of possession. If the U.S. wants to advance, early composure and game management could matter as much as attacking quality.',
    'Group Stage',
    array['United States','Paraguay','Australia','Türkiye'],
    'Group D',
    null,
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    '2026-05-10T00:00:00Z'
  ),
  (
    'story-brazil-watch',
    'is-brazil-the-team-everyone-should-watch',
    'Is Brazil the team everyone should be watching?',
    'Brazil has ceiling, depth, and knockout pedigree — but can they stay balanced?',
    'Brazil’s path always starts with flair, but their tournament hopes usually depend on structure. If they can control midfield transitions and avoid open, end-to-end matches, they become one of the most complete squads in the field. Group-stage consistency could set their knockout tone.',
    'Title Race',
    array['Brazil','Morocco','Scotland','Haiti'],
    'Group C',
    null,
    null,
    '2026-05-11T00:00:00Z'
  ),
  (
    'story-england-path',
    'englands-path-looks-friendly-but-is-it-a-trap',
    'England’s path looks friendly — but is it a trap?',
    'The draw looks manageable, but underestimating group chaos has ended runs before.',
    'England’s group can look straightforward on paper, but tournament momentum can flip quickly. Croatia’s experience, Ghana’s physical edge, and Panama’s discipline can create awkward match scripts. If England starts slowly, pressure will mount instantly.',
    'Pressure Watch',
    array['England','Croatia','Ghana','Panama'],
    'Group L',
    null,
    null,
    '2026-05-12T00:00:00Z'
  ),
  (
    'story-france-pressure',
    'france-enters-with-pressure-not-comfort',
    'France enters with pressure, not comfort.',
    'France has elite quality, but this group demands intensity from kickoff.',
    'France rarely lacks talent, but this cycle starts under a microscope. Senegal can stretch games, Norway can punish set-piece lapses, and Iraq can force uncomfortable tempo. For France, the bigger question is mindset: can they control pressure before pressure controls them?',
    'Pressure Watch',
    array['France','Senegal','Iraq','Norway'],
    'Group I',
    null,
    null,
    '2026-05-13T00:00:00Z'
  ),
  (
    'story-mexico-host-pressure',
    'mexico-has-home-field-pressure-from-day-one',
    'Mexico has home-field pressure from day one.',
    'Hosting can be power — or pressure — and Mexico starts with both.',
    'Mexico opens with home support and major expectations. South Africa can sit deep and counter, South Korea can run games into transition battles, and Czechia can grind results. Mexico’s margin for error may be slimmer than the noise suggests.',
    'Dark Horse',
    array['Mexico','South Africa','South Korea','Czechia'],
    'Group A',
    null,
    null,
    '2026-05-14T00:00:00Z'
  )
on conflict (id) do update
set
  slug = excluded.slug,
  title = excluded.title,
  teaser = excluded.teaser,
  body = excluded.body,
  category = excluded.category,
  related_teams = excluded.related_teams,
  related_group = excluded.related_group,
  image_url = excluded.image_url,
  video_url = excluded.video_url,
  created_at = excluded.created_at,
  updated_at = now();
