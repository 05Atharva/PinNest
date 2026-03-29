import { applyFilter, useNotesStore } from '../store/notesStore';

/**
 * Convenience hook that exposes the notes store with a computed filteredNotes.
 * filteredNotes is derived here (not in the store) to avoid Immer getter issues.
 */
export const useNotes = () => {
  const notes = useNotesStore((s) => s.notes);
  const loading = useNotesStore((s) => s.loading);
  const error = useNotesStore((s) => s.error);
  const activeFilter = useNotesStore((s) => s.activeFilter);
  const fetchNotes = useNotesStore((s) => s.fetchNotes);
  const addNote = useNotesStore((s) => s.addNote);
  const editNote = useNotesStore((s) => s.editNote);
  const removeNote = useNotesStore((s) => s.removeNote);
  const toggleComplete = useNotesStore((s) => s.toggleComplete);
  const setFilter = useNotesStore((s) => s.setFilter);

  const filteredNotes = applyFilter(notes, activeFilter);

  return {
    notes,
    filteredNotes,
    loading,
    error,
    activeFilter,
    fetchNotes,
    addNote,
    editNote,
    removeNote,
    toggleComplete,
    setFilter,
  };
};
