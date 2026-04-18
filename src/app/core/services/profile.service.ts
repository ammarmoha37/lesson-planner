import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface ProfileFormData {
  name: string;
  school: string;
  governorate: string;
  subject: string;
  grades: string;
  experience: string;
}

export interface UsageStats {
  lesson_count: number;
  total_tokens: number;
  total_cost: number;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  constructor(
    private sb: SupabaseService,
    private auth: AuthService,
  ) {}

  async updateProfile(data: ProfileFormData): Promise<string | null> {
    const err = await this.auth.updateProfile(data);
    return err?.message || null;
  }

  async getMyUsage(): Promise<UsageStats> {
    const user = this.auth.user();
    if (!user) return { lesson_count: 0, total_tokens: 0, total_cost: 0 };

    try {
      const { data } = await this.sb.supabase.rpc('get_user_monthly_usage', { uid: user.id });
      const row = data?.[0];
      return {
        lesson_count: row?.lesson_count || 0,
        total_tokens: row?.total_tokens || 0,
        total_cost: row?.total_cost || 0,
      };
    } catch {
      return { lesson_count: 0, total_tokens: 0, total_cost: 0 };
    }
  }
}
