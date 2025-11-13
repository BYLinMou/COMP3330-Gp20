import { supabase } from './supabase';

export interface PetState {
  user_id: string;
  mood: number;        // 0-100
  hunger: number;      // 0-100
  xp: number;          // Experience points
  level: number;       // Current level
  last_feed_at: string;
  updated_at: string;
}

/**
 * Get the current user's pet state
 */
export async function getPetState() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('pet_state')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching pet state:', error);
      throw error;
    }

    // If no pet state exists, create one
    if (!data) {
      return await initializePet();
    }

    return data as PetState;
  } catch (error) {
    console.error('Failed to fetch pet state:', error);
    throw error;
  }
}

/**
 * Initialize pet state for a new user
 */
export async function initializePet() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('pet_state')
      .insert([
        {
          user_id: user.id,
          mood: 50,
          hunger: 100,
          xp: 0,
          level: 1,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error initializing pet:', error);
      throw error;
    }

    return data as PetState;
  } catch (error) {
    console.error('Failed to initialize pet:', error);
    throw error;
  }
}

/**
 * Feed the pet
 */
export async function feedPet() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get current state
    const currentState = await getPetState();
    
    // Update hunger (max 100) and mood
    const newHunger = Math.min(100, currentState.hunger + 20);
    const newMood = Math.min(100, currentState.mood + 10);

    const { data, error } = await supabase
      .from('pet_state')
      .update({
        hunger: newHunger,
        mood: newMood,
        last_feed_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error feeding pet:', error);
      throw error;
    }

    return data as PetState;
  } catch (error) {
    console.error('Failed to feed pet:', error);
    throw error;
  }
}

/**
 * Add XP to the pet (called when user completes tasks)
 */
export async function addXP(amount: number) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const currentState = await getPetState();
    const newXP = currentState.xp + amount;
    
    // Simple leveling: 100 XP per level
    const newLevel = Math.floor(newXP / 100) + 1;
    const leveledUp = newLevel > currentState.level;

    const { data, error } = await supabase
      .from('pet_state')
      .update({
        xp: newXP,
        level: newLevel,
        // Bonus mood if leveled up
        mood: leveledUp 
          ? Math.min(100, currentState.mood + 20)
          : currentState.mood,
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error adding XP:', error);
      throw error;
    }

    return { pet: data as PetState, leveledUp };
  } catch (error) {
    console.error('Failed to add XP:', error);
    throw error;
  }
}

/**
 * Update pet mood and hunger based on time passed
 * Call this periodically (e.g., when user opens the app)
 */
export async function updatePetStatus() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const currentState = await getPetState();
    const lastFeed = new Date(currentState.last_feed_at);
    const now = new Date();
    const hoursPassed = (now.getTime() - lastFeed.getTime()) / (1000 * 60 * 60);

    // Decrease hunger and mood over time
    const hungerDecrease = Math.floor(hoursPassed * 2); // 2 points per hour
    const moodDecrease = Math.floor(hoursPassed * 1);   // 1 point per hour

    const newHunger = Math.max(0, currentState.hunger - hungerDecrease);
    const newMood = Math.max(0, currentState.mood - moodDecrease);

    // Only update if there's a change
    if (newHunger !== currentState.hunger || newMood !== currentState.mood) {
      const { data, error } = await supabase
        .from('pet_state')
        .update({
          hunger: newHunger,
          mood: newMood,
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating pet status:', error);
        throw error;
      }

      return data as PetState;
    }

    return currentState;
  } catch (error) {
    console.error('Failed to update pet status:', error);
    throw error;
  }
}
