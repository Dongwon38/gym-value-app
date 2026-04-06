# Gym Search Places Refactor Plan v0.2.1

## Delta from v0.2
- This revision removes machine-specific absolute paths and keeps all references repo-portable.
- Autocomplete fallback is corrected:
  - suggestion taps no longer assume suggestion payloads are save-ready
  - if Place Details fails, the flow falls back to seeded remote text search instead of jumping directly to confirm/save
- Autocomplete session token lifecycle is tightened from “one token per sheet open” to “one token per autocomplete interaction session.”
- Cache-key rules are now explicit and anchor-aware by search kind, query, nearby radius, locale, and region.
- Caching scope is narrowed for this phase:
  - cache `text` search
  - cache `nearby` search
  - do not cache autocomplete yet
- Nearby fetch policy is explicitly bounded so it does not refetch on every render.
- Source mapping compatibility is now explicit:
  - runtime result sources may become `places_text` / `places_nearby`
  - persisted `search_source` remains `google_places`
- This document now states more clearly that the app remains local-first overall:
  - local SQLite remains the source of truth after save
  - this is a search-surface refactor only
  - manual fallback remains first-class

## Summary
This refactor is grounded in the current source tree, especially:
- `apps/mobile/src/features/gym/components/GymSetupSection.tsx`
- `apps/mobile/src/features/gym/useCases/searchGyms.ts`
- `apps/mobile/src/data/services/placesSearchService.ts`

The implementation goal for this phase is:

1. make remote gym search reliable and clean
2. preserve the existing search/manual/save UX baseline
3. keep save semantics and SQLite schema stable
4. defer local DB search quality, ranking, and hybrid merge logic to a later phase

This is an online-search-first refactor of the gym setup/search surface only. It does not change the app’s broader local-first architecture. Saved gyms, app settings, visits, and costs remain locally owned in SQLite. Remote Places lookups are discovery helpers before save, not a new system of record.

## 1. Baseline audit

### What exists today
- `GymSetupSection.tsx` already provides:
  - search/manual tab split
  - explicit `Search` button
  - submit-to-search behavior
  - selected-result confirm/save step
  - `Use current location for search` CTA
- The current confirm/save baseline is:
  - default radius: `150m`
  - default timezone: device timezone from `getDeviceIanaTimeZone()`
- `searchGyms.ts` currently implements a hybrid local-first orchestration:
  - local DB candidate recall
  - local scoring
  - skip-remote threshold
  - cache/quota handling
  - Places fallback
  - merged local + remote ranking
- `placesSearchService.ts` currently uses one remote POST endpoint and parses array rows into `GymSearchResult`.
- `migration003GymSearchSupport` already exists and is baseline:
  - gym metadata columns
  - `gym_search_cache`
  - `gym_place_search_usage`
  - `gym_search_logs`
- `saveGymFromSearchResult.ts` already provides stable write semantics:
  - `existingGymId` reuse
  - `external_place_id` dedupe
  - dedupe-key fallback
- `useDeviceLocation.ts` already supports on-demand current location lookup without automatic permission prompts.

### What already works
- manual gym entry
- search -> results -> select -> confirm/save
- current-location search bias CTA
- save path compatibility with Places metadata
- search cache and daily quota storage
- telemetry logging

### What is overly complex for this phase
For the current phase goal, the following are more complex than necessary:
- local DB recall as the primary candidate source
- `scoreLocalGymCandidate`
- `mergeSearchResults`
- local-threshold-based remote skipping
- local-first ranking rules in the active search path

These pieces may remain in the codebase for a future phase, but they should not define the user-facing search path now.

## 2. Scope reduction / scope refocus

### In scope now
- online-first text search
- autocomplete as an augmentation to explicit search
- nearby browse inside the existing gym setup surface
- selection -> optional details enrich -> confirm/save
- clean provider/service boundaries
- cache/quota support for online-first search
- preserve current manual entry and save flow
- migration path from the current single endpoint toward a cleaner provider/proxy contract

### Explicitly deferred
- local DB search quality improvements
- local SQL recall tuning
- local ranking/scoring improvements
- hybrid local+remote merged ranking
- local-first remote-skip behavior
- offline/local gym search UX as a primary path
- coordinate-based timezone resolution
- confirm-radius default changes
- new screens or navigation paths

### Non-goals for this phase
- Do not make local DB search a user-facing recall source yet.
- Do not improve ranking quality by blending saved gyms into active search results.
- Do not redesign gym setup IA.
- Do not change `saveGymFromSearchResult` semantics.
- Do not add a separate “near me” screen.
- Do not make the app depend on remote data after save.

## 3. Target architecture for this phase

### UI state boundaries
- `GymSetupSection.tsx` remains the owner of the existing search/manual editor UX.
- Search-specific state should be decomposed out of the component into a dedicated hook, recommended name:
  - `useGymSearchFlow`
- `useGymSearchFlow` owns:
  - query text
  - suggestion state
  - text-search result state
  - nearby state
  - selected result
  - confirm-step state
  - current autocomplete session token
  - anchor preference state
  - search loading/error meta
- `GymSetupSection` becomes a rendering container around:
  - manual form section
  - search input + controls
  - suggestion list
  - result list
  - confirm/save step

### Use-case boundaries
Refactor the active path into separate online-first use cases:
- `searchGymsRemote`
- `autocompleteGymsRemote`
- `browseNearbyGymsRemote`
- `loadGymPlaceDetails`

Current `searchGyms.ts` should be simplified into remote-first orchestration rather than local-first orchestration. The current local scoring/merge path should be removed from the active runtime path for this phase.

Recommended structure:
- keep `searchGyms.ts` as the main text-search use case entrypoint if that minimizes churn
- move provider orchestration and cache/quota logic behind smaller helpers
- remove local DB recall/ranking from its active flow

### Provider/service boundaries
Add a dedicated contract file instead of overloading `types.ts`.

Recommended new contract file:
- `apps/mobile/src/domain/gymSearch/contracts.ts`

This file should hold:
- `GymSearchProvider`
- request/response contracts for:
  - autocomplete
  - text search
  - nearby search
  - place details

`types.ts` should continue to hold durable app-level types that are already used broadly. Provider/service contracts should not all be added to the generic `types.ts` file unless implementation friction makes that unavoidable.

The UI layer must not parse raw Google Places payloads directly.

### Transport/proxy boundaries
This phase must support a safe migration from the current single endpoint model.

Recommended migration path:
1. keep the current single text-search endpoint working behind an adapter
2. introduce provider contracts that support:
   - autocomplete
   - text search
   - nearby
   - details
3. allow the provider implementation to evolve from:
   - single endpoint for text search only
   - to route-based proxy support as backend capabilities are added

The UI and use cases must not know whether the provider is backed by:
- one endpoint
- multiple routes
- mixed rollout

### Cache/quota boundaries
Cache and quota remain useful in this phase, but only as online-search reliability features.

Keep:
- `GymSearchCacheRepository`
- `PlacesSearchUsageRepository`

Use them for:
- remote text search
- remote nearby search

Do not add autocomplete caching in this phase.

### Save/dedupe boundaries
Keep `saveGymFromSearchResult.ts` as the final write path.
All search flows in this phase must end by mapping into the existing save input contract.

This means:
- text-search results must be save-ready
- nearby results must be save-ready
- details results must be save-ready
- autocomplete suggestions are not assumed to be save-ready

### Implementation invariants
The refactor must not break any of the following:
- manual tab remains available and fully usable
- explicit `Search` button remains available
- current location CTA remains available
- selected-result confirm/save step remains in place
- default confirm radius stays `150m`
- device-timezone default stays unchanged
- `saveGymFromSearchResult` remains the final write path

## 4. Data/interface contracts for this phase

### `GymSearchSuggestion`
Suggestions are lightweight autocomplete items and are not save-ready.

```ts
type GymSearchSuggestion = {
  placeId: string;
  mainText: string;
  secondaryText?: string | null;
};
```

No latitude/longitude is required here.

### `GymSearchResult`
Results shown in the list and passed into confirm/save must be save-ready.

```ts
type GymSearchResult = {
  source: 'places_text' | 'places_nearby';
  placeId: string | null;
  name: string;
  formattedAddress?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  region?: string | null;
  countryCode?: string | null;
  postalCode?: string | null;
  brandName?: string | null;
  latitude: number;
  longitude: number;
  score?: number;
  gymId?: string;
};
```

Notes:
- `score` may remain temporarily for compatibility, but it is not used for new local-ranking work in this phase.
- `gymId` may remain optional for future compatibility, but active online-first search should not depend on local candidate rows.

### `GymPlaceDetails`
Details are fetched only after row or suggestion selection and must be save-ready.

```ts
type GymPlaceDetails = {
  placeId: string;
  name: string;
  formattedAddress?: string | null;
  addressLine1?: string | null;
  city?: string | null;
  region?: string | null;
  countryCode?: string | null;
  postalCode?: string | null;
  brandName?: string | null;
  latitude: number;
  longitude: number;
};
```

### `GymSearchProvider`
Recommended contract location:
- `apps/mobile/src/domain/gymSearch/contracts.ts`

```ts
type GymSearchProvider = {
  autocomplete(input: {
    query: string;
    sessionToken: string;
    locale?: string;
    regionCode?: string;
    latitude?: number;
    longitude?: number;
    limit?: number;
  }): Promise<GymSearchSuggestion[]>;

  textSearch(input: {
    query: string;
    locale?: string;
    regionCode?: string;
    latitude?: number;
    longitude?: number;
    limit?: number;
  }): Promise<GymSearchResult[]>;

  nearbySearch(input: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
    locale?: string;
    regionCode?: string;
    limit?: number;
  }): Promise<GymSearchResult[]>;

  getPlaceDetails(input: {
    placeId: string;
    locale?: string;
    regionCode?: string;
  }): Promise<GymPlaceDetails | null>;
};
```

### Compatibility mapping for persistence
Internal runtime result sources can become more precise:
- `places_text`
- `places_nearby`

But persistence mapping must remain stable:
- `places_text` -> persisted `search_source = 'google_places'`
- `places_nearby` -> persisted `search_source = 'google_places'`

Telemetry/search-log compatibility must also stay stable:
- both remote result sources map to telemetry/log `source = 'places'`

Future local/hybrid sources may map differently, but not in this phase.

## 5. Search behavior rules for this phase

### Anchor precedence
Use the following precedence consistently:
1. explicit device location from the current-location CTA
2. saved primary gym coordinates
3. no coordinates, fallback to locale/region bias only

### Query normalization
Normalize before provider calls:
- trim
- lowercase for compare helpers
- compact normalization for cache keys and equality checks
- apply brand-friendly normalization such as appending `" gym"` only where current query-normalization utilities already support it cleanly

This phase should keep normalization light and practical. It should not expand into a ranking project.

### Remote text search behavior
- explicit `Search` button and keyboard submit both call the same remote text-search path
- keep current minimum query length baseline: `>= 2`
- when query is too short, clear results and do not call the network
- no local-first ranking or remote-skip threshold in this phase

### Autocomplete behavior
Autocomplete augments explicit search; it does not replace it.

Rules:
- start at `>= 2` characters
- debounce: `300ms`
- use a dedicated autocomplete interaction session token
- suggestions are displayed while the user is actively typing
- suggestion taps do not go directly to confirm/save unless details returns save-ready coordinates

#### Autocomplete session token lifecycle
The token lifecycle must be tighter than “one token per sheet open.”

Rules:
- create a token when a real autocomplete interaction begins:
  - first debounced autocomplete request for the current unfinished typing session
- reuse that token while the user continues typing/refining suggestions in the same interaction
- dispose/rotate the token when any of the following happens:
  - user taps a suggestion and the details attempt completes, whether success or failure
  - user executes explicit text search instead of continuing autocomplete
  - user clears the query and suggestions are dismissed
  - user switches away from the search tab or closes/resets the editor
- after any of those completion/reset events, the next autocomplete typing session gets a fresh token

### Autocomplete fallback on details failure
This phase chooses the safer fallback:

If suggestion tap -> `getPlaceDetails(placeId)` fails or returns insufficient save-ready coordinates:
- do not route directly to confirm/save
- instead, run remote text search seeded from the suggestion label
  - seed with `mainText`
  - optionally include `secondaryText` in the displayed search context
- show the remote result list
- require the user to select a save-ready result row before confirm/save

This avoids incorrect saves from non-save-ready suggestion payloads.

### Nearby behavior
Nearby remains inside the existing gym setup/search surface.

Rules:
- show nearby rows only when:
  - search tab is active
  - query is empty
  - an anchor is available
- nearby must not trigger automatic permission prompts
- if anchor is missing:
  - show search input
  - show current location CTA
  - keep manual fallback available

### Nearby loading policy
Nearby must not refetch on every render.

Recommended fetch policy:
- fetch nearby once when the search surface becomes active with a valid anchor and empty query
- refetch only when one of the following happens:
  - the anchor becomes available after being unavailable
  - the anchor changes materially
  - the user explicitly refreshes the search surface
  - the editor is closed/reset and opened again
- “materially changes” should be keyed using the same anchor-bucketing policy used for cache keys
- no automatic permission prompt should be triggered as part of nearby loading

Default nearby browse radius for this phase:
- `5000m`

This is a browse radius, not the gym confirm/save radius.

### Cache/quota behavior
Cache successful remote responses only.

#### What is cached in this phase
- text search
- nearby search

#### What is not cached in this phase
- autocomplete
- place details

Autocomplete caching is deferred as a future optimization.

#### Cache-key rules
Cache keys must vary by every input dimension that materially affects result quality.

Use namespaced keys:

For text search:
- `text`
- normalized query
- anchor key when present
- locale when materially relevant
- regionCode when materially relevant

For nearby search:
- `nearby`
- anchor key
- nearby radius
- locale when materially relevant
- regionCode when materially relevant

Rules:
- do not reuse text-search cache across different anchors/cities
- do not reuse nearby cache across different anchors
- do not reuse nearby cache across different nearby radii
- keep the current spirit of anchor-aware caching from the existing `buildPlacesSearchCacheKey` logic
- extend the existing anchor-bucketing approach rather than inventing a new unrelated one in this phase

Examples:
- `text|q=goodlife|anchor=49.28_-123.12|locale=en-CA|region=CA`
- `nearby|anchor=49.28_-123.12|radius=5000|locale=en-CA|region=CA`

#### Quota rules
- fresh successful remote calls increment quota
- cache hits do not increment quota
- quota exhaustion is non-fatal
- manual entry remains usable
- explicit Search remains visible even when remote quota is exhausted; the UI should show an appropriate non-blocking message

### Local DB behavior in this phase
- local DB search is not a primary recall source in this phase
- local DB ranking is not improved in this phase
- local saved gyms are not merged into active user-facing search results
- local DB still matters for:
  - save dedupe
  - metadata persistence
  - search logs
  - cache
  - quota
  - future corpus accumulation

## 6. UI flow by stage

### Stage 0 — Baseline preservation
Keep the current working UX intact:
- search/manual tab split
- explicit Search
- keyboard submit
- current location CTA
- selected-result confirm/save
- confirm defaults:
  - radius `150m`
  - device timezone

### Stage 1 — Online text-search stabilization
- simplify `searchGyms.ts` to remote-first orchestration
- keep current screen UI intact
- remove local-first ranking from the active path
- keep cache/quota handling
- keep non-fatal failure behavior

Shippable checkpoint:
- query -> remote results -> select -> confirm/save works reliably

### Stage 2 — Autocomplete augmentation
- add suggestion fetching with debounce
- introduce interaction-scoped session token lifecycle
- keep explicit Search fully intact
- suggestion tap -> details attempt
- details success -> confirm/save
- details failure -> seeded remote text-search results, not direct save

Shippable checkpoint:
- autocomplete improves entry speed without changing explicit Search semantics

### Stage 3 — Nearby browse inside the same surface
- when query is empty and anchor exists, show nearby results inside the existing search surface
- no new screen
- no automatic permission prompt
- fetch policy follows the nearby loading rules above

Shippable checkpoint:
- empty-query browse works without disrupting manual or text search

### Stage 4 — Details enrich/save hardening
- centralize mapping from provider result/details payloads into `SaveGymFromSearchInput`
- keep `saveGymFromSearchResult` as final writer
- normalize source mapping for persistence and telemetry

Shippable checkpoint:
- text-search, nearby, and details-backed saves all reuse the same final save path

## 7. Migration/schema impact

### What stays
- `migration003GymSearchSupport`
- all existing search-support columns on `gyms`
- `gym_search_cache`
- `gym_place_search_usage`
- `gym_search_logs`
- `saveGymFromSearchResult`
- manual gym entry path
- `useDeviceLocation` on-demand permission pattern

### What changes
- runtime search orchestration
- provider/service boundaries
- cache-key construction
- UI search-state decomposition
- transport/proxy abstraction
- internal runtime result-source labels if more granular source values are introduced

### What is intentionally unused or de-emphasized for now
- local candidate recall as an active user-facing source
- local score threshold remote skipping
- local+remote merge ranking
- local search quality tuning

### What must not be recreated
- do not create a second migration for gym search support
- do not re-add schema for cache/quota/logs under a new migration name
- do not create a second save path separate from `saveGymFromSearchResult`

## 8. Rollout plan

### Step 1 — Extract contracts and adapter boundary
- add `domain/gymSearch/contracts.ts`
- define provider contracts
- wrap the current single endpoint model behind a provider adapter for text search
- keep the UI/use-case surface stable

Safe checkpoint:
- existing explicit Search still works via provider-backed text search

### Step 2 — Simplify `searchGyms.ts`
- remove local-first ranking from the active path
- keep text search, cache, quota, anchor handling
- keep output shape compatible with current UI

Safe checkpoint:
- remote text-search path is reliable and simpler than the current hybrid flow

### Step 3 — Split `GymSetupSection` search state
- introduce `useGymSearchFlow`
- move search/autocomplete/nearby/selection state out of the large component
- keep rendering and current UX unchanged

Safe checkpoint:
- component complexity drops without changing behavior

### Step 4 — Add autocomplete
- add provider `autocomplete`
- implement interaction-scoped session token lifecycle
- wire suggestion list into current search surface
- keep explicit Search visible and unchanged

Safe checkpoint:
- autocomplete can ship independently
- if autocomplete fails, search still works

### Step 5 — Add nearby browse
- add provider `nearbySearch`
- fetch nearby only under the bounded loading policy
- keep it inside the same search surface

Safe checkpoint:
- empty-query nearby browse can ship independently

### Step 6 — Add details enrich + save mapping hardening
- add provider `getPlaceDetails`
- use details only after selection
- on details failure, route to seeded text search
- finalize source mapping compatibility

Safe checkpoint:
- all remote flows end in the same stable save path

## 9. Deferred future phase
Future phase name:
- `Hybrid Local Gym Search`

### Future work
- local DB recall quality
- local ranking/scoring
- hybrid local + remote merge
- local-first optimization after enough gyms accumulate
- offline/local search UX
- richer local brand/type ranking

### Existing artifacts that already prepare for that future phase
- `gyms` search-support columns
- `name_compact`, `search_keywords`, `dedupe_key`
- `GymSearchCacheRepository`
- `GymSearchLogRepository`
- `searchGymsLocalCandidates`
- `scoreLocalGymCandidate`
- `mergeSearchResults`
- distance and normalization helpers

This phase does not remove that future option. It only removes those concerns from the active implementation path now.

## 10. Test plan

### Use-case / domain tests
- query normalization still produces stable keys
- text search returns remote results only from the active online-first path
- cache hit bypasses fresh quota increment
- quota exhaustion does not block manual fallback
- nearby fetch only runs when the nearby context key changes
- details success routes to confirm/save
- details failure routes to seeded text-search results, not direct save
- persistence-source mapping collapses remote result sources to `google_places`

### UI tests
- search/manual tab split remains
- explicit Search remains
- keyboard submit remains
- current location CTA remains
- confirm/save step remains
- default radius still initializes to `150`
- default timezone still initializes from device timezone
- autocomplete suggestions appear after debounce
- suggestion tap does not enter confirm/save without save-ready data
- nearby appears only on empty query with anchor
- nearby does not appear on every render
- manual entry remains fully usable

### Integration tests
- current single-endpoint provider adapter works for text search
- cache keys vary by anchor/query/radius/locale/region as required
- text-search results, nearby results, and details-backed results all map into the same final save path
- save dedupe behavior by `existingGymId`, `external_place_id`, and dedupe key remains unchanged

### Acceptance scenarios
- `"goodlife"` returns remote gyms near the selected anchor and saves successfully
- `"boxing gym"` works with primary-gym or device-location bias
- location denied still allows text search
- empty query with anchor shows nearby browse inside the same sheet
- autocomplete failure does not break explicit Search
- suggestion details failure still leaves the user on a valid remote-results path
- after save, gym source of truth remains local SQLite

## 11. File-level action map

| File | Action | Notes |
|---|---|---|
| `apps/mobile/src/features/gym/components/GymSetupSection.tsx` | split | keep current UX; move search state into `useGymSearchFlow` |
| `apps/mobile/src/features/gym/useCases/searchGyms.ts` | simplify | remote-first text-search orchestration only |
| `apps/mobile/src/data/services/placesSearchService.ts` | split/replace | move toward provider-backed transport adapters |
| `apps/mobile/src/domain/gymSearch/contracts.ts` | add | new home for provider contracts and request/response shapes |
| `apps/mobile/src/domain/gymSearch/types.ts` | narrow/keep | keep durable app types; avoid overloading with all provider contracts |
| `apps/mobile/src/domain/gymSearch/searchGymsConfig.ts` | simplify | keep remote/cache/quota knobs; remove active local-first tuning from the primary path |
| `apps/mobile/src/config/places.ts` | migrate | preserve current single-endpoint compatibility; prepare route-based config migration |
| `apps/mobile/src/features/gym/useCases/saveGymFromSearchResult.ts` | keep | stable final write path |
| `apps/mobile/src/data/repositories/GymRepository.ts` | keep/defer | keep write/dedupe logic; defer local-search optimization work |
| `apps/mobile/src/data/repositories/GymSearchCacheRepository.ts` | keep/update | extend keys for text/nearby dimensions; no autocomplete cache |
| `apps/mobile/src/data/repositories/PlacesSearchUsageRepository.ts` | keep | quota remains for remote protection |
| `apps/mobile/src/features/location/useDeviceLocation.ts` | keep | current on-demand permission model is correct |
| `apps/mobile/src/utils/gymSearch/scoreLocalGymCandidate.ts` | defer | remove from active imports; keep for future phase |
| `apps/mobile/src/utils/gymSearch/mergeSearchResults.ts` | defer | remove from active imports; keep for future phase |
| `apps/mobile/src/utils/gymSearch/*` normalization/distance helpers | keep/selective | keep only helpers still needed by remote-first flow |
| `apps/mobile/src/data/db/migrations/003_gym_search_support.ts` | keep | baseline schema; must not be recreated |
| `apps/mobile/src/features/gym/useCases/searchGyms.test.ts` | rewrite | align tests with remote-first behavior |
| `apps/mobile/src/features/gym/useCases/saveGymFromSearchResult.test.ts` | keep/extend | preserve save compatibility coverage |
| gym setup/search UI tests | extend | cover autocomplete, nearby, seeded-search fallback, and invariant preservation |

## Assumptions and defaults
- The current source tree is the baseline truth for this plan.
- Manual entry remains first-class.
- Confirm/save default radius stays `150m` in this phase.
- Confirm/save timezone default stays device timezone in this phase.
- Local DB search optimization is intentionally deferred.
- Remote failures remain non-fatal.
- Saved gyms and app state remain locally owned in SQLite after save.
- This is a gym-search-surface refactor, not a change to the app’s overall local-first architecture.
