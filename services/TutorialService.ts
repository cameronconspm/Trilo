import { supabase } from '@/lib/supabase';
import { isValidUUID } from '@/utils/uuidUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TutorialStatus {
  user_id: string;
  needs_tutorial: boolean;
  tutorial_completed: boolean;
  completed_at: string | null;
  updated_at: string | null;
}

export class TutorialService {
  readonly userId: string;
  private readonly storageKey: string;

  constructor(userId: string) {
    this.userId = userId;
    this.storageKey = `@trilo:tutorial_status_${userId}`;
  }

  private get table() {
    return supabase.from('user_tutorial_status');
  }

  private getDefaultStatus(): TutorialStatus {
    return {
      user_id: this.userId,
      needs_tutorial: true,
      tutorial_completed: false,
      completed_at: null,
      updated_at: null,
    };
  }

  private async getStatusFromStorage(): Promise<TutorialStatus | null> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (!stored) return null;
      return JSON.parse(stored) as TutorialStatus;
    } catch (error) {
      console.error('TutorialService: Failed to read from AsyncStorage', error);
      return null;
    }
  }

  private async saveStatusToStorage(status: TutorialStatus): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(status));
    } catch (error) {
      console.error('TutorialService: Failed to save to AsyncStorage', error);
      throw error;
    }
  }

  async getStatus(): Promise<TutorialStatus | null> {
    // For non-UUID users (test accounts), use AsyncStorage
    if (!isValidUUID(this.userId)) {
      return await this.getStatusFromStorage();
    }

    // For UUID users, fetch from Supabase
    try {
      const { data, error } = await this.table
        .select('*')
        .eq('user_id', this.userId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data as TutorialStatus | null;
    } catch (error) {
      console.error('TutorialService: Failed to fetch status from Supabase', error);
      // Fallback to AsyncStorage if Supabase fails
      return await this.getStatusFromStorage();
    }
  }

  async ensureStatus(): Promise<TutorialStatus> {
    const existingStatus = await this.getStatus();

    if (existingStatus) {
      return existingStatus;
    }

    // No existing status found, create default
    const status = this.getDefaultStatus();

    // Save to appropriate storage
    if (isValidUUID(this.userId)) {
      await this.upsertStatus(status);
    } else {
      await this.saveStatusToStorage(status);
    }

    return status;
  }

  async markNeedsTutorial(): Promise<void> {
    const status: TutorialStatus = {
      user_id: this.userId,
      needs_tutorial: true,
      tutorial_completed: false,
      completed_at: null,
      updated_at: null,
    };

    if (isValidUUID(this.userId)) {
      await this.upsertStatus(status);
    } else {
      await this.saveStatusToStorage(status);
    }
  }

  async markCompleted(): Promise<void> {
    const status: TutorialStatus = {
      user_id: this.userId,
      needs_tutorial: false,
      tutorial_completed: true,
      completed_at: new Date().toISOString(),
      updated_at: null,
    };

    if (isValidUUID(this.userId)) {
      await this.upsertStatus(status);
    } else {
      await this.saveStatusToStorage(status);
    }
  }

  private async upsertStatus(status: TutorialStatus): Promise<void> {
    try {
      const { error } = await this.table.upsert(
        {
          ...status,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        },
      );

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('TutorialService: Failed to upsert status', error);
      throw error;
    }
  }
}

