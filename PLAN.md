# Meme Feed Full-App Plan

## Product Goal
- Deliver a web app where authenticated users design and publish memes, and the community can browse and upvote them.
- Keep InstantDB (app id `23683b32-9ab6-4f30-8b2d-d1fdcaa6906b`) as the single source of truth for auth, meme data, and vote state.
- Maintain a smooth meme-creation experience (template picker, image upload, draggable text) while layering on social features like feeds, voting, and moderation.

## Architecture Overview
- **Frontend**: Next.js (App Router) with client components located under `app/` and shared UI in `components/`. Continue leveraging the existing meme editor (`MemeCanvas`, `TemplateGallery`, etc.).
- **State/Data**: InstantDB React SDK (`lib/instantdb.ts`) for `useQuery`, `useAuth`, and atomic `tx` transactions. Keep schema definitions centralized in `lib/schema.ts`.
- **Styling**: Expand `app/globals.css` to cover new UI states (feed, auth modals, vote buttons) without introducing purple/blue gradients (per workspace rule).
- **Auth**: InstantDB magic-code (email OTP) auth surfaced via `AuthButton` with inline status/error handling.
- **Media**: Store rendered meme images as base64 strings temporarily; later consider moving heavy assets to object storage and saving URLs in InstantDB.

## Data Model Tasks
1. Finalize InstantDB schema (`lib/schema.ts`). ✅ Now includes richer `textBoxes` metadata (font size/color/align) matching the implementation summary.
   - `memes`: `id`, `userId`, `imageData`, `textBoxes`, `upvotes`, `createdAt`.
   - `upvotes`: `memeId`, `userId`, `createdAt` to enforce one vote per user/meme.
   - Optionally add `users` collection for profile handles/avatars once auth is stable.
2. Seed helper indices/queries.
   - Create query helpers (e.g., `getSortedMemes(sortBy)`, `getUserUpvote(memeId)`).
   - Consider server-side validation rules or guardrails if InstantDB supports them.

## Feature Workstreams
### 1. Authentication & Identity
- Harden `AuthButton`: inline validation, error surface, ~~password rules~~ **magic-code flow** (done). Next up: loading skeletons + profile settings so `MemeCard` can display usernames instead of raw ids.
- Gate meme creation (`app/create/page.tsx`) and voting to authenticated users (already enforced, but add UX feedback/tooltips).
- Add lightweight profile settings so `MemeCard` can display usernames instead of raw ids.

### 2. Meme Creation Flow
- Audit `MemeCanvas`, `TemplateGallery`, and upload handling for edge cases (large files, mobile drag). **In progress**; base editor + owner edit/delete already shipped.
- Persist template metadata in InstantDB or `public/assets` manifest so new templates auto-appear. (Currently reading from hardcoded list + `public/assets/` per implementation summary.)
- Enhance text editing tools (font, color, stroke) and store those attributes inside `textBoxes`. **Partially done** – schema supports attributes, UI hooks still to follow.
- On publish: write meme via `tx.memes[...]` and optionally upload the rendered PNG to object storage, saving the URL in InstantDB to reduce payload sizes.
- Enable editing/deleting only for meme owners; confirm guard in UI and transaction layer. ✅ Implemented in `MemeCard`.

### 3. Feed & Discovery
- Keep `/feed` as the default route that queries InstantDB for memes sorted by `upvotes` or `createdAt`. ✅ Implemented.
- Add pagination or infinite scroll to avoid pulling the entire dataset.
- Surface per-meme metadata: author, relative time, upvote count from schema.
- Introduce filtering (mine vs all, templates, search by text) using InstantDB query params.
- Add optimistic UI for upvotes/edit/delete actions with graceful error states.

### 4. Upvote System
- Use `tx.upvotes` mirror table plus `memes.upvotes` counter (already scaffolded) for fast sorting.
- Ensure `handleUpvote` in `MemeCard` performs atomic transactions: create/delete vote row + increment/decrement counter.
- Prevent double-votes by querying `upvotes` filtered on `memeId` + `userId` before mutation (already implemented, but add optimistic cache updates and disable buttons while pending).
- Consider server validation (InstantDB rules) to guarantee a user cannot create multiple upvotes for the same meme even if the client misbehaves.

### 5. Moderation & Safety (Stretch)
- Reporting flow that flags inappropriate memes (new `reports` collection).
- Basic rate limiting on meme creation/upvotes (tracked per user).
- Image content guidelines and safe deletion flows.

## Integration & DevOps Tasks
1. **Environment Setup**
   - Store InstantDB app id in `.env` (e.g., `NEXT_PUBLIC_INSTANTDB_APP_ID`) and reference it inside `lib/instantdb.ts` to avoid hardcoding secrets.
   - Document required environment variables in `README.md`.
2. **Testing**
   - Write component tests for editor controls and feed sorting.
   - Add integration tests simulating meme creation + upvote toggling using InstantDB test workspace or mocked layer.
3. **Performance**
   - Lazy-load template images, memoize heavy components, and compress stored meme data.
   - Offload large base64 images to edge storage when scaling becomes a concern.
4. **Deployment**
   - Use Vercel (Next.js native) with environment variables.
   - Run lint/test pipeline (GitHub Actions) to catch regressions before deploy.

## Implementation Milestones
1. **Foundation** ✅
   - Confirm InstantDB connectivity with provided app id. (Handled via env + runtime guard.)
   - Stabilize auth + meme CRUD + upvote toggling end to end. (Covered in current implementation.)
2. **Product Polish**
   - Improve editor UX, feed layout, and responsive design.
   - Add user profiles, better empty/error states, and notifications.
3. **Scale & Safety**
   - Introduce pagination, moderation, and optional storage offloading.
   - Automate testing/deployment and monitor performance metrics.

## Status Sync
- For a snapshot of what’s complete vs pending, see `IMPLEMENTATION_SUMMARY.md`. Keep both documents updated together when shipping new slices.

This roadmap keeps the current codebase as the base layer while outlining the concrete work needed to turn it into a production-ready meme sharing app backed by InstantDB.


