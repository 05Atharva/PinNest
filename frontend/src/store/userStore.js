import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { supabase } from '../services/supabase';

const initialState = {
  user: null,
  session: null,
};

export const useUserStore = create(
  immer((set) => ({
    ...initialState,
    setUser: (user) => {
      set((state) => {
        state.user = user;
      });
    },
    setSession: (session) => {
      set((state) => {
        state.session = session;
        state.user = session?.user ?? null;
      });
    },
    signOut: async () => {
      await supabase.auth.signOut();
      set((state) => {
        state.user = null;
        state.session = null;
      });
    },
  }))
);
