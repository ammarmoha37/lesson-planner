import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface SystemStats {
  total_users: number;
  total_plans: number;
  monthly_cost: number;
  active_today: number;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  school: string;
  governorate: string;
  role: string;
  is_active: boolean;
  monthly_limit: number;
  created_at: string;
  plan_count: number;
  total_tokens: number;
  total_cost: number;
}

export interface UsageRow {
  user_id: string;
  profiles: { name: string; email: string; school: string } | null;
  estimated_cost: number;
  total_tokens: number;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private sb: SupabaseService) {}

  async getSystemStats(): Promise<SystemStats> {
    try {
      const { data } = await this.sb.supabase.rpc('get_system_stats');
      const s = data?.[0] || {};
      return {
        total_users: s.total_users || 0,
        total_plans: s.total_plans || 0,
        monthly_cost: s.monthly_cost || 0,
        active_today: s.active_today || 0,
      };
    } catch {
      return { total_users: 0, total_plans: 0, monthly_cost: 0, active_today: 0 };
    }
  }

  async getAllUsers(): Promise<AdminUser[]> {
    const { data: users } = await this.sb.supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!users?.length) return [];

    const { data: usage } = await this.sb.supabase
      .from('api_usage')
      .select('user_id, total_tokens, estimated_cost')
      .in(
        'user_id',
        users.map((u: any) => u.id),
      );

    const statsMap = new Map<string, { count: number; tokens: number; cost: number }>();
    (usage || []).forEach((r: any) => {
      const prev = statsMap.get(r.user_id) || { count: 0, tokens: 0, cost: 0 };
      prev.count++;
      prev.tokens += r.total_tokens || 0;
      prev.cost += r.estimated_cost || 0;
      statsMap.set(r.user_id, prev);
    });

    return users.map((u: any) => ({
      ...u,
      plan_count: statsMap.get(u.id)?.count || 0,
      total_tokens: statsMap.get(u.id)?.tokens || 0,
      total_cost: statsMap.get(u.id)?.cost || 0,
    }));
  }

  async getMonthlyUsage(): Promise<UsageRow[]> {
    const startOfMonth = new Date(new Date().setDate(1)).toISOString();
    const { data: usage } = await this.sb.supabase
      .from('api_usage')
      .select('user_id, estimated_cost, total_tokens, created_at')
      .gte('created_at', startOfMonth)
      .order('created_at', { ascending: false });
    if (!usage?.length) return [];

    const userIds = [...new Set(usage.map((r: any) => r.user_id))];
    const { data: profiles } = await this.sb.supabase
      .from('profiles')
      .select('id, name, email, school')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
    return usage.map((r: any) => ({
      ...r,
      profiles: profileMap.get(r.user_id) || null,
    }));
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    return this.sb.supabase.from('profiles').update({ is_active: isActive }).eq('id', userId);
  }

  async updateUserLimit(userId: string, limit: number) {
    return this.sb.supabase.from('profiles').update({ monthly_limit: limit }).eq('id', userId);
  }
}
