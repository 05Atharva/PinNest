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
    const payload = { ...noteData };
    // Let the database generate the UUID when creating a note.
    if (!payload.id) delete payload.id;
    if (!payload.user_id) {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) payload.user_id = userData.user.id;
    }
    const { data, error } = await supabase
      .from('notes')
      .insert(payload)
      .select('*')
      .single();
    return handle(data, error);
  } catch (error) {
    return handle(null, error);
  }
};

export const updateNote = async (id, updates) => {
  try {
    const payload = { ...updates };
    if ('id' in payload) delete payload.id;
    const { data, error } = await supabase
      .from('notes')
      .update(payload)
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
    if (!id) {
      return handle(null, new Error('Missing note id'));
    }
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
