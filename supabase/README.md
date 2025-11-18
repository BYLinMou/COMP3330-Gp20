# Supabase Database Setup

This directory contains SQL migration files for the AuraSpend database schema.

## Quick Setup

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard at https://supabase.com/dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Copy the contents of `migrations/20251119_add_pet_tables.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Link your project (first time only)
supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
supabase db push
```

## What This Migration Does

The `20251119_add_pet_tables.sql` migration creates:

1. **`user_pets` table** - Stores multiple pets that users can collect
   - Each user can have multiple pets
   - One pet can be active at a time
   - Includes pet type, breed, name, emoji, and purchase date

2. **Updates to `pet_state` table**
   - Adds `current_pet_id` column to track the active pet

3. **Row Level Security (RLS) Policies**
   - Users can only view and modify their own pets
   - Automatic security enforcement at the database level

## Verification

After running the migration, verify it worked:

```sql
-- Check if user_pets table exists
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'user_pets';

-- Check if current_pet_id column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'pet_state' 
AND column_name = 'current_pet_id';
```

## Troubleshooting

### Foreign Key Error on pet_state

If you get a foreign key error when creating pet_state records, make sure:
1. A profile exists for the user in the `profiles` table
2. The `initializeUserAccount()` function is called during sign-up

### Table Not Found Error

If you get "Could not find the table 'public.user_pets'" error:
1. The migration hasn't been run yet - follow the setup steps above
2. Check Supabase dashboard → Database → Tables to verify the table exists
3. Try refreshing the schema cache in your app by restarting Expo

## Schema Overview

```
profiles (existing)
  └── pet_state (existing)
        └── current_pet_id → user_pets (new)
              ├── user_id → auth.users
              ├── pet_type
              ├── pet_breed
              ├── pet_name
              ├── pet_emoji
              └── is_active
```
