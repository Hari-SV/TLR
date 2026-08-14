# Leaderboard: How It Works

## Architecture

`stats.js` runs a `collectionGroup('gameSessions')` query across every
user, filtered to `completed == true`, then reduces the results
client-side to each player's single best (lowest) `durationSeconds`.
Usernames are resolved separately via the `usernames` collection.

This briefly used a denormalized `leaderboardEntries` collection instead
(to work around a teammate's temporary tightening of collection-group
access to admin-only), but the team decided there's no sensitive data in
`gameSessions` worth restricting, so that tightening was reverted and the
leaderboard reads directly from `gameSessions` again. If you're looking
at an old version of this file or old code, that's the difference.

## What the rules need to allow

- `usernames` collection: public `list` (needed to resolve uids to
  display names).
- `gameSessions` collection group: public `list` (needed for the
  cross-user query).

Both are set in the current `firestore.rules`. If either gets tightened
again by a future rules change, the leaderboard will start failing with
a `permission-denied` error -- see below.

## Required index

The `where('completed', '==', true)` filter on a collection-group query
needs a composite index: collection group `gameSessions`, field
`completed`, scope **Collection group**, order ascending. This is defined
in `firestore.indexes.json` for CLI deployment, or can be created by hand
in the console (Firestore → Indexes → Composite → Create Index). Firestore
also throws a direct one-click creation link in the console error if it's
missing -- click that if the manual link ever misbehaves.

## Errors you might see

**`permission-denied`** -- the rules currently live in the console don't
match `firestore.rules` in this project. Re-publish it.

**`... requires a COLLECTION_GROUP_ASC index ...`** -- the composite
index above doesn't exist yet, or is still building (can take a minute
or two after creation). `stats.js` surfaces this error with a direct
creation link when it can extract one from the error message.

## Data freshness

Unlike the denormalized-collection approach, this version always reflects
live data -- there's no separate "sync" step and nothing to wait on. A
completed run shows up on the leaderboard the moment it's queried, no
profile visit required.
