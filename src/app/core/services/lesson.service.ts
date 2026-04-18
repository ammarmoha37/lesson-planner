import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface LessonPlan {
  id?: string;
  user_id?: string;
  title: string;
  subject: string;
  grade: string;
  unit?: string;
  semester?: string;
  periods?: string;
  date?: string;
  plan_text: string;
  plan_html?: string;
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class LessonService {
  constructor(
    private sb: SupabaseService,
    private auth: AuthService,
  ) {}

  async savePlan(plan: LessonPlan): Promise<{ error: string | null }> {
    const user = this.auth.user();
    if (!user) return { error: 'غير مسجل الدخول' };

    const { error } = await this.sb.supabase.from('lesson_plans').insert({
      user_id: user.id,
      title: plan.title,
      subject: plan.subject,
      grade: plan.grade,
      unit: plan.unit || null,
      semester: plan.semester || null,
      periods: plan.periods || null,
      date: plan.date || null,
      content: plan.plan_text,
      plan_text: plan.plan_text,
    });

    return { error: error?.message || null };
  }

  async getPlans(): Promise<LessonPlan[]> {
    const user = this.auth.user();
    if (!user) return [];

    const { data } = await this.sb.supabase
      .from('lesson_plans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    return (data as LessonPlan[]) || [];
  }

  async deletePlan(id: string): Promise<{ error: string | null }> {
    const { error } = await this.sb.supabase.from('lesson_plans').delete().eq('id', id);

    return { error: error?.message || null };
  }

  async getPlanCount(): Promise<number> {
    const user = this.auth.user();
    if (!user) return 0;

    const { count } = await this.sb.supabase
      .from('lesson_plans')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    return count || 0;
  }
}
