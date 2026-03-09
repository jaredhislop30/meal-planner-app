# Meal Planner App V1 Design

## 1. Product Goal

Help a user quickly create a meal plan, generate a consolidated grocery list, remove items they already have, and send the final list to Smith's (Kroger) cart for checkout on Kroger's website.

## 2. V1 Scope

### In Scope

- Preference filters:
  - Healthy options
  - Fast options
  - Good for kids
  - Comfort food
- Meal slots:
  - Breakfast
  - Lunch
  - Dinner
- Meal selection from suggested list
- Recipe display for selected meals
- Consolidated grocery list from all selected meals
- Grocery list grouping by category (staples, spices, dairy, meat, vegetables, etc.)
- User can remove items they already have
- User can connect/login to Smith's (Kroger)
- User can send selected grocery items to Kroger cart
- User completes purchase on Kroger site/app

### Out of Scope (V1)

- In-app payment/transaction processing
- Real-time pricing comparisons
- Inventory tracking over time
- Nutrition scoring beyond simple tags
- Multi-user/shared household plans

## 3. Primary User Flow

1. User chooses preferences (`healthy`, `fast`, `kids`, `comfort`).
2. User chooses meal slots (`breakfast`, `lunch`, `dinner`).
3. System suggests meals matching selected filters and slots.
4. User picks meals from each slot.
5. System shows recipes for selected meals.
6. System generates one grocery list merged across all meals.
7. Grocery list is grouped by category.
8. User removes items they already have.
9. User clicks `Send to Smith's (Kroger)`.
10. User logs into Kroger (OAuth) if needed.
11. System creates/fills Kroger cart with mapped items.
12. User is redirected to Kroger to complete checkout.

## 4. Functional Requirements

### Meal Discovery

- Must filter meals by:
  - Tag filters (`healthy`, `fast`, `kids`, `comfort`)
  - Meal type (`breakfast`, `lunch`, `dinner`)
- Each meal record should include:
  - Title
  - Meal type
  - Tags
  - Prep/cook time
  - Servings
  - Ingredients (with quantity + unit + category)
  - Recipe steps

### Meal Plan Builder

- User can choose one or more meal slots for a plan.
- User can select one meal per slot in V1 (can extend to multiple later).
- Plan is stored so user can reopen/edit before grocery export.

### Grocery List Generation

- Aggregate ingredients from all selected meals.
- Merge duplicate ingredients across meals.
- Normalize units where possible (`tbsp`, `tablespoon`, `T`).
- Keep unresolved unit conflicts as separate lines in V1 (safe default).
- Group lines by category.

### Grocery List Editing

- User can:
  - Mark item as `have already` (excluded from export)
  - Keep item for purchase (included in export)
- Display final `to buy` list before export.

### Kroger Cart Handoff

- OAuth login to Kroger account.
- Map grocery lines to Kroger catalog items.
- Add matched items to cart.
- Return status:
  - `added`
  - `partially_added`
  - `unmatched`
- Redirect user to Kroger for checkout.

## 5. Non-Functional Requirements

- Fast plan generation (< 2 seconds for normal payload sizes).
- Deterministic grocery-list merge behavior.
- Clear error handling for Kroger auth and item mapping failures.
- Secure token handling (encrypted at rest).
- Basic audit logging for export attempts and outcomes.

## 6. Suggested V1 Architecture

## Frontend

- Web app (React + Next.js recommended)
- Key screens:
  - Preferences + meal slots
  - Meal suggestions + selection
  - Plan summary + recipes
  - Grocery list editor
  - Kroger connect/export result

## Backend

- REST API (Node.js/TypeScript recommended)
- Responsibilities:
  - Meal query/filtering
  - Meal-plan persistence
  - Grocery-list generation and normalization
  - Kroger OAuth + cart integration orchestration

## Data

- PostgreSQL for core entities
- Optional Redis cache for meal query performance

## Integrations

- Kroger API (OAuth2 + cart/item endpoints)

## 7. Initial Data Model (Relational)

### users

- id (uuid, pk)
- email (unique)
- created_at

### user_kroger_accounts

- id (uuid, pk)
- user_id (fk users.id)
- kroger_account_id
- oauth_access_token (encrypted)
- oauth_refresh_token (encrypted)
- token_expires_at
- created_at
- updated_at

### meals

- id (uuid, pk)
- title
- meal_type (enum: breakfast/lunch/dinner)
- prep_minutes
- cook_minutes
- servings
- recipe_steps (jsonb)
- created_at

### meal_tags

- meal_id (fk meals.id)
- tag (enum: healthy/fast/kids/comfort)

### meal_ingredients

- id (uuid, pk)
- meal_id (fk meals.id)
- ingredient_name
- quantity (numeric)
- unit (text)
- category (enum: staples/spices/dairy/meat/vegetables/fruits/frozen/pantry/other)

### meal_plans

- id (uuid, pk)
- user_id (fk users.id)
- name
- status (enum: draft/finalized)
- created_at

### meal_plan_items

- id (uuid, pk)
- meal_plan_id (fk meal_plans.id)
- meal_type (enum: breakfast/lunch/dinner)
- meal_id (fk meals.id)

### grocery_lists

- id (uuid, pk)
- meal_plan_id (fk meal_plans.id)
- status (enum: draft/ready/exported)
- created_at

### grocery_list_items

- id (uuid, pk)
- grocery_list_id (fk grocery_lists.id)
- ingredient_name
- quantity (numeric)
- unit (text)
- category (enum)
- include_in_export (boolean default true)
- source_meal_ids (uuid[])

### kroger_exports

- id (uuid, pk)
- grocery_list_id (fk grocery_lists.id)
- status (enum: pending/success/partial/failed)
- result_summary (jsonb)
- created_at

## 8. API Design (V1)

### Meal Discovery

- `GET /api/meals?mealType=breakfast&tags=healthy,fast`
- `GET /api/meals/:id`

### Meal Plan

- `POST /api/meal-plans`
  - body: selected slots + selected meal ids
- `GET /api/meal-plans/:id`
- `PATCH /api/meal-plans/:id`

### Grocery List

- `POST /api/meal-plans/:id/grocery-list/generate`
- `GET /api/grocery-lists/:id`
- `PATCH /api/grocery-lists/:id/items/:itemId`
  - body: `{ includeInExport: boolean }`

### Kroger

- `GET /api/integrations/kroger/connect-url`
- `GET /api/integrations/kroger/oauth/callback`
- `POST /api/grocery-lists/:id/export/kroger`
- `GET /api/exports/:id`

## 9. Kroger Integration Notes

- Use OAuth2 authorization code flow.
- Store tokens securely and rotate refresh tokens.
- Build a product-matching layer:
  - First pass: exact name/category match
  - Fallback: fuzzy match with confidence threshold
- For low-confidence matches, mark as `unmatched` and show to user.
- V1 can skip manual resolution UI and simply report unmatched items.

## 10. UX Notes for V1

- Keep planning flow linear and simple:
  - Step 1: Preferences + meal slots
  - Step 2: Pick meals
  - Step 3: Review recipes + grocery list
  - Step 4: Connect and send to Kroger
- Show grocery categories in collapsible sections.
- Show counts:
  - `total items`
  - `removed items`
  - `items sent to Kroger`

## 11. Risks and Mitigations

- Kroger API limits/changes:
  - Mitigation: isolate integration in dedicated service module and log full request/response metadata.
- Ingredient normalization complexity:
  - Mitigation: conservative merge rules in V1; do not over-normalize ambiguous units.
- Product matching quality:
  - Mitigation: report unmatched clearly; allow user to proceed with partial cart.

## 12. Implementation Phases

### Phase 1: Foundation

- Set up monorepo/app skeleton
- Create DB schema and seed data for meals/ingredients/tags
- Implement meal discovery endpoints

### Phase 2: Meal Plan + Grocery Core

- Build meal-plan creation flow
- Implement grocery-list generation and category grouping
- Add include/exclude grocery-item toggles

### Phase 3: Kroger Integration

- OAuth connect flow
- Cart export endpoint
- Export results UI and failure messaging

### Phase 4: Hardening

- Add tests (unit + integration + happy-path e2e)
- Add audit logs + observability dashboards
- Add basic rate limits and retry/backoff for API calls

## 13. Acceptance Criteria for V1

- User can create a meal plan with selected preferences and meal slots.
- User can select meals and view recipes.
- System generates one merged grocery list grouped by category.
- User can remove grocery items before export.
- User can connect Smith's (Kroger) account.
- System exports included items to Kroger cart.
- User completes purchase on Kroger site (outside app).
