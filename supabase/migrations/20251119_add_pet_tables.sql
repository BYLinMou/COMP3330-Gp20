-- Add user_pets table for managing multiple pets per user
CREATE TABLE IF NOT EXISTS public.user_pets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pet_type TEXT NOT NULL, -- 'dog', 'cat', 'turtle', 'hamster', etc.
    pet_breed TEXT NOT NULL, -- 'Labrador', 'Persian', etc.
    pet_name TEXT NOT NULL, -- User's name for the pet
    pet_emoji TEXT NOT NULL, -- Emoji representation
    is_active BOOLEAN DEFAULT false, -- Currently active pet
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_active_pet_per_user UNIQUE NULLS NOT DISTINCT (user_id, is_active)
);

-- Add current_pet_id column to pet_state table
ALTER TABLE public.pet_state 
ADD COLUMN IF NOT EXISTS current_pet_id UUID REFERENCES public.user_pets(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_pets_user_id ON public.user_pets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pets_is_active ON public.user_pets(user_id, is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE public.user_pets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_pets
CREATE POLICY "Users can view their own pets"
    ON public.user_pets FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own pets"
    ON public.user_pets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pets"
    ON public.user_pets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pets"
    ON public.user_pets FOR DELETE
    USING (auth.uid() = user_id);

-- Add comment to the table
COMMENT ON TABLE public.user_pets IS 'Stores multiple pets that users can collect and switch between';
