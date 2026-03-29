import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  markComplete,
} from '../services/notesService';

const initialState = {
  notes: [],
  loading: false,
  error: null,
  activeFilter: 'all',
};

const applyFilter = (notes, filter) => {
  if (filter === 'active') return notes.filter((n) => !n.is_completed);
  if (filter === 'completed') return notes.filter((n) => n.is_completed);
  return notes;
};

export const useNotesStore = create(
  immer((set, get) => ({
    ...initialState,
    get filteredNotes() {
      return applyFilter(get().notes, get().activeFilter);
    },
    setFilter: (filter) => {
      set((state) => {
        state.activeFilter = filter;
      });
    },
    fetchNotes: async (userId) => {
      set((state) => {
        state.loading = true;
        state.error = null;
      });
      const { data, error } = await getNotes(userId);
      set((state) => {
        state.loading = false;
        if (error) {
          state.error = error.message ?? 'Failed to fetch notes';
        } else {
          state.notes = data ?? [];
        }
      });
    },
    addNote: async (noteData) => {
      const tempId = `temp-${Date.now()}`;
      set((state) => {
        state.error = null;
        state.notes.unshift({
          id: tempId,
          ...noteData,
          is_completed: false,
          created_at: new Date().toISOString(),
        });
      });
      const { data, error } = await createNote(noteData);
      set((state) => {
        if (error) {
          state.error = error.message ?? 'Failed to create note';
          state.notes = state.notes.filter((n) => n.id !== tempId);
        } else if (data) {
          state.notes = state.notes.map((n) => (n.id === tempId ? data : n));
        }
      });
    },
    editNote: async (id, updates) => {
      const prev = get().notes.find((n) => n.id === id);
      if (!prev) return;
      set((state) => {
        state.error = null;
        state.notes = state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n));
      });
      const { data, error } = await updateNote(id, updates);
      set((state) => {
        if (error) {
          state.error = error.message ?? 'Failed to update note';
          state.notes = state.notes.map((n) => (n.id === id ? prev : n));
        } else if (data) {
          state.notes = state.notes.map((n) => (n.id === id ? data : n));
        }
      });
    },
    removeNote: async (id) => {
      const prev = get().notes;
      set((state) => {
        state.error = null;
        state.notes = state.notes.filter((n) => n.id !== id);
      });
      const { error } = await deleteNote(id);
      if (error) {
        set((state) => {
          state.error = error.message ?? 'Failed to delete note';
          state.notes = prev;
        });
      }
    },
    toggleComplete: async (id) => {
      const prev = get().notes.find((n) => n.id === id);
      if (!prev) return;
      const nextStatus = !prev.is_completed;
      set((state) => {
        state.error = null;
        state.notes = state.notes.map((n) =>
          n.id === id
            ? { ...n, is_completed: nextStatus, completed_at: nextStatus ? new Date().toISOString() : null }
            : n
        );
      });
      const { data, error } = nextStatus
        ? await markComplete(id)
        : await updateNote(id, { is_completed: false, completed_at: null });
      set((state) => {
        if (error) {
          state.error = error.message ?? 'Failed to toggle completion';
          state.notes = state.notes.map((n) => (n.id === id ? prev : n));
        } else if (data) {
          state.notes = state.notes.map((n) => (n.id === id ? data : n));
        }
      });
    },
  }))
);
