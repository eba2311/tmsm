import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      login: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken }),

      logout: () => set({ user: null, accessToken: null, refreshToken: null }),

      updateUser: (updates) =>
        set((state) => ({ user: { ...state.user, ...updates } })),

      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),
    }),
    {
      name: 'amtms-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
