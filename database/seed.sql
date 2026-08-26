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
