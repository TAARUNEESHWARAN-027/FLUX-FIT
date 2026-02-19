import { create } from 'zustand';
import type { Profile, ProfileUpdate } from '@/types';
import { profileService } from '@/services/profileService';

interface ProfileState {
    profile: Profile | null;
    loading: boolean;
    error: string | null;

    fetchProfile: (userId: string) => Promise<void>;
    updateProfile: (userId: string, data: ProfileUpdate) => Promise<void>;
    refreshXp: (userId: string) => Promise<void>;
    clear: () => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
    profile: null,
    loading: false,
    error: null,

    fetchProfile: async (userId) => {
        set({ loading: true, error: null });
        try {
            const profile = await profileService.getProfile(userId);
            set({ profile, loading: false });
        } catch (err) {
            set({ error: (err as Error).message, loading: false });
        }
    },

    updateProfile: async (userId, data) => {
        set({ loading: true, error: null });
        try {
            const profile = await profileService.updateProfile(userId, data);
            set({ profile, loading: false });
        } catch (err) {
            set({ error: (err as Error).message, loading: false });
        }
    },

    refreshXp: async (userId) => {
        try {
            const profile = await profileService.getProfile(userId);
            set({ profile });
        } catch (err) {
            set({ error: (err as Error).message });
        }
    },

    clear: () => set({ profile: null, loading: false, error: null }),
}));
