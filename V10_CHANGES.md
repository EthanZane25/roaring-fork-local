# Roaring Fork Local v10

This release builds on the existing v9 feature set. It does not intentionally remove any working route or product.

## Stability
- Includes the complete coherent v9 source set so the homepage, restaurant directory, contest voting, verification, admin, messaging, blog, and Supabase helpers stay in sync.
- Restores/supports the newer contest voting data model and service-role helpers that were missing from the partially copied GitHub working tree.

## Town preference
- The selected town is remembered in localStorage and a first-party cookie.
- Primary navigation carries the selected town to Restaurants, Marketplace, Vote, Events, Jobs, and Housing.
- Header search uses the selected/saved town automatically.

## Search
- Search continues to cover Restaurants, Marketplace, and Events.
- When a live Supabase database is configured, search also covers real Jobs and Housing inventory.
- Demo mode does not surface placeholder Jobs or Housing as real listings.

## Jobs and Housing
- Demo mode keeps the existing honest “inventory is being built” pages.
- Production mode now renders real database inventory and respects the selected town.

## Restaurant details
- Reads the existing restaurant_hours and restaurant_menus tables.
- Adds weekly hours, menu links, website, directions, and open/closed status when available.
- Adds opening-hours information to Restaurant JSON-LD when hour rows exist.

## Validation performed
- All TypeScript/TSX files were syntax-parsed successfully.
- All project @/ alias imports resolve to files in the v10 tree.
- A full npm typecheck/build still needs to run in the real repository where node_modules/package-lock are available.
