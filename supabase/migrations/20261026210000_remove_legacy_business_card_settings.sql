-- Remove persisted settings for the retired presentation-card feature.
-- This only removes card-specific keys; normal business contact/profile fields remain.
update public.businesses b
set settings = jsonb_set(
  coalesce(b.settings, '{}'::jsonb),
  '{commercial_profile}',
  (coalesce(b.settings->'commercial_profile', '{}'::jsonb)
    - array[
      'cardEnabled','cardName','cardEmail','cardPhone',
      'cardShowEmail','cardShowPhone','cardShowAddress','cardShowWebsite',
      'cardText','cardPrimaryColor','cardBackgroundColor','cardTextColor'
    ]),
  true
)
where jsonb_typeof(b.settings->'commercial_profile') = 'object'
  and (b.settings->'commercial_profile') ?| array[
    'cardEnabled','cardName','cardEmail','cardPhone',
    'cardShowEmail','cardShowPhone','cardShowAddress','cardShowWebsite',
    'cardText','cardPrimaryColor','cardBackgroundColor','cardTextColor'
  ];
