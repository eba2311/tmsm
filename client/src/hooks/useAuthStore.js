import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      rehydrated: false,
      isAuthRestoring: false,

      login: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken }),

      logout: () => set({ user: null, accessToken: null, refreshToken: null }),

      updateUser: (updates) =>
        set((state) => ({ user: { ...state.user, ...updates } })),

      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),

      setRehydrated: () => set({ rehydrated: true }),

      setAuthRestoring: (value) => set({ isAuthRestoring: value }),
    }),
    {
      name: 'amtms-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.setRehydrated) {
          state.setRehydrated();
        }
      },
    }
  )
);
