# CreatorKit AI Roadmap

This roadmap follows the next-step sequence already implied by the current product shape.

## 1. Surface the top fix more prominently

Goal:

- make the primary edit obvious in the frontend result card
- reduce time-to-action after an analysis completes

What this means:

- highlight the single most important suggestion
- keep strengths, risks, and supporting details visible, but secondary
- add an obvious rewrite or “try this next” action if it fits the workflow

Success looks like:

- users can scan the result card and immediately see the highest-value edit
- the result panel reads like a decision surface, not just a report

## 2. Persist analyses and user history

Goal:

- store every analysis so drafts can be revisited later
- give users a lightweight history of what they analyzed and when

What this means:

- add a persistence layer for submissions and results
- attach timestamps and basic metadata to each analysis
- expose a history view or sidebar in the product

Success looks like:

- a user can reopen recent analyses
- the app can compare current and past drafts

## 3. Add saved drafts and comparison

Goal:

- let users compare iterations of the same idea
- make versioning part of the product instead of a manual process

What this means:

- add draft naming or draft grouping
- support saved versions for the same concept
- show changes between versions where useful

Success looks like:

- users can see how a draft changed over time
- the app helps them choose which version to publish

## 4. Replace or augment the heuristic scorer

Goal:

- improve scoring quality once enough usage data exists
- move from static rules toward model-backed or hybrid scoring

What this means:

- keep the existing API contract stable
- introduce a trained model, a rules/model hybrid, or a better ranking layer
- preserve deterministic fallbacks for edge cases

Success looks like:

- scores become more consistent with real creator judgment
- the backend contract does not need to change for the frontend

## 5. Add authentication and creator accounts

Goal:

- connect analyses to people instead of anonymous sessions
- unlock private history, saved drafts, and account-level workflows

What this means:

- add sign-in and account creation
- scope history and drafts per user
- prepare for team or creator-brand workflows later

Success looks like:

- each user sees only their own analyses by default
- future collaboration features have a real identity layer to build on

## 6. Deploy the product

Goal:

- move the app from local development into a real hosted product
- make the current workflow available to actual users

What this means:

- deploy the frontend and backend
- configure environment variables and production URLs
- verify the analysis flow end to end in production

Success looks like:

- the app is reachable on a public URL
- the main submit-analyze-review loop works outside the local machine

## Delivery Order

Recommended sequence:

1. Frontend feedback emphasis
2. Persistence foundation
3. Draft history and comparison
4. Scoring improvements
5. Authentication and accounts
6. Deployment

That order keeps the product shippable while making each later step cheaper and more reliable.
