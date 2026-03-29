import { supabase } from './supabase';

const handle = (data, error) => ({ data, error: error ?? null });

export const getNotes = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return handle(data, error);
  } catch (error) {
    return handle(null, error);
  }
};

export const createNote = async (noteData) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .insert(noteData)
      .select('*')
      .single();
    return handle(data, error);
  } catch (error) {
    return handle(null, error);
  }
};

export const updateNote = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    return handle(data, error);
  } catch (error) {
    return handle(null, error);
  }
};

export const deleteNote = async (id) => {
  try {
    const { data, error } = await supabase.from('notes').delete().eq('id', id);
    return handle(data, error);
  } catch (error) {
    return handle(null, error);
  }
};

export const markComplete = async (id) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .update({ is_completed: true, completed_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    return handle(data, error);
  } catch (error) {
    return handle(null, error);
  }
};
