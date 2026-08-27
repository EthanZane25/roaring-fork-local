insert into public.towns (slug, name, county, latitude, longitude) values
('aspen','Aspen','Pitkin',39.191100,-106.817500),
('snowmass-village','Snowmass Village','Pitkin',39.213000,-106.937800),
('basalt','Basalt','Eagle/Pitkin',39.368900,-107.032800),
('carbondale','Carbondale','Garfield',39.402200,-107.211200),
('glenwood-springs','Glenwood Springs','Garfield',39.550500,-107.324800),
('new-castle','New Castle','Garfield',39.572800,-107.536400),
('silt','Silt','Garfield',39.548600,-107.656200),
('rifle','Rifle','Garfield',39.534700,-107.783100)
on conflict (slug) do nothing;

insert into public.restaurants
(slug,name,town_slug,address,description,cuisines,meals,search_tags,price_level,latitude,longitude,image_url,open_now,local_votes,verified_at)
values
('white-house-tavern','White House Tavern','aspen','302 E Hopkins Ave, Aspen, CO','A compact Aspen favorite known for sandwiches, salads and a lively bar in a historic miner''s cottage.',array['american'],array['lunch','dinner'],array['burgers','family-friendly'],2,39.190800,-106.817900,'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1400&q=80',true,932,now()),
('paradise-bakery','Paradise Bakery','aspen','320 S Galena St, Aspen, CO','Central Aspen bakery serving coffee, breakfast pastries, cookies and ice cream.',array['bakery','coffee'],array['breakfast','lunch'],array['breakfast','coffee','family-friendly'],1,39.189700,-106.817200,'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1400&q=80',true,771,now()),
('mezzaluna-aspen','Mezzaluna','aspen','624 E Cooper Ave, Aspen, CO','Relaxed Italian dining with wood-fired dishes, pizza and a central Aspen patio.',array['italian','pizza'],array['lunch','dinner'],array['pizza','italian','outdoor-dining'],3,39.188500,-106.814000,'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1400&q=80',true,640,now()),
('the-pullman','The Pullman','glenwood-springs','330 7th St, Glenwood Springs, CO','Downtown Glenwood Springs restaurant with creative American plates and cocktails.',array['american'],array['lunch','dinner'],array['happy-hour'],3,39.547100,-107.324800,'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1400&q=80',true,584,now()),
('silo','Silo','carbondale','1909 Dolores Way, Carbondale, CO','Neighborhood breakfast and lunch spot with coffee, bowls and locally minded ingredients.',array['american','coffee'],array['breakfast','lunch'],array['breakfast','coffee'],2,39.399800,-107.210300,'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1400&q=80',true,415,now()),
('brick-pony','Brick Pony Pub','basalt','202 Midland Ave, Basalt, CO','Casual Basalt pub with burgers, comfort food and local beer.',array['american','pub'],array['lunch','dinner'],array['burgers','happy-hour','family-friendly'],2,39.368600,-107.032200,'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1400&q=80',true,363,now())
on conflict (slug) do nothing;

with new_poll as (
  insert into public.polls(slug,title,description)
  values ('best-burger-valley-2026','Best Burger in the Valley','One verified vote per person. Results update as votes are counted.')
  on conflict (slug) do update set title=excluded.title
  returning id
)
insert into public.poll_options(poll_id,label,town_slug,sort_order)
select id,'White House Tavern','aspen',1 from new_poll
union all select id,'Brick Pony Pub','basalt',2 from new_poll
union all select id,'The Pullman','glenwood-springs',3 from new_poll
on conflict (poll_id, label) do nothing;

with favorite_poll as (
  insert into public.polls(slug,title,description,poll_type)
  values (
    'favorite-restaurant-valley-2026',
    'Favorite Restaurant in the Roaring Fork Valley',
    'Choose the one restaurant you would most recommend to a friend. One verified person gets one vote.',
    'favorite_restaurant'
  )
  on conflict (slug) do update set title=excluded.title, description=excluded.description, poll_type=excluded.poll_type
  returning id
)
insert into public.poll_options(poll_id,label,town_slug,restaurant_id,sort_order)
select favorite_poll.id, r.name, r.town_slug, r.id,
       row_number() over (order by r.town_slug, r.name)::integer
from favorite_poll
cross join public.restaurants r
where r.published = true
on conflict (poll_id, label) do update
set restaurant_id = excluded.restaurant_id,
    town_slug = excluded.town_slug;

insert into public.blog_posts(slug,title,excerpt,body,author_name,town_slug,status,published_at)
values
(
  'how-roaring-fork-local-will-cover-the-valley',
  'How Roaring Fork Local will cover the valley',
  'A practical local guide should make it easier to find what is open, what is for sale and what is happening without digging through several different sites.',
  E'Roaring Fork Local is being built around everyday local information. The goal is simple: make restaurants, classifieds, jobs, housing, events and community recommendations easier to find from Aspen through Rifle.\n\nThe site will continue to improve as local businesses claim their pages and residents submit corrections, tips and story suggestions. We want useful information to stay current instead of becoming another directory that slowly goes stale.',
  'Roaring Fork Local',
  'aspen',
  'published',
  now()
),
(
  'send-us-your-local-suggestions',
  'What should we cover next?',
  'Tell us about a new restaurant, a useful local resource, a community issue or something people in the valley should know about.',
  E'Some of the best local information starts with a neighbor sending a tip. If there is a restaurant we missed, an event that deserves attention, a useful service, a recurring local problem or a story you think we should look into, send it to us.\n\nSuggestions are reviewed before anything is published. Sending a suggestion does not automatically create a public post.',
  'Roaring Fork Local',
  null,
  'published',
  now()
)
on conflict (slug) do nothing;

-- Ensure the complete visible restaurant seed set is present before cuisine grouping.
insert into public.restaurants
(slug,name,town_slug,address,description,cuisines,meals,search_tags,price_level,latitude,longitude,image_url,open_now,local_votes,verified_at)
values
('sake-aspen','Sake','aspen','110 Carriage Way, Snowmass Village, CO','Contemporary Japanese and sushi selections with mountain-resort energy.',array['japanese','sushi'],array['dinner'],array['sushi'],4,39.208800,-106.949400,'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=1400&q=80',false,488,now()),
('sammy-pizza','Sammy''s Rocky Mountain Pizza','rifle','412 Park Ave, Rifle, CO','Rifle pizza shop serving pies, wings and casual family meals.',array['pizza','italian'],array['lunch','dinner'],array['pizza','family-friendly'],1,39.534000,-107.783400,'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=1400&q=80',true,284,now())
on conflict (slug) do nothing;

-- Required primary cuisine values for the cuisine-first directory.
update public.restaurants set primary_cuisine = case slug
  when 'white-house-tavern' then 'american'
  when 'the-pullman' then 'american'
  when 'silo' then 'american'
  when 'mezzaluna-aspen' then 'italian'
  when 'sake-aspen' then 'japanese'
  when 'paradise-bakery' then 'cafe-bakery'
  when 'brick-pony' then 'american'
  when 'sammy-pizza' then 'italian'
  else 'other'
end;

with contest as (
  insert into public.contests(slug,title,starts_at,ends_at,status)
  values ('best-burger-valley-2026','Best Burger in the Valley','2026-08-26T00:00:00-06:00','2026-09-15T23:59:59-06:00','open')
  on conflict (slug) do update
  set title=excluded.title, starts_at=excluded.starts_at, ends_at=excluded.ends_at, status=excluded.status, updated_at=now()
  returning id
)
insert into public.contest_restaurants(contest_id,restaurant_id)
select contest.id, r.id
from contest
join public.restaurants r on r.slug in ('white-house-tavern','brick-pony','the-pullman')
on conflict do nothing;
