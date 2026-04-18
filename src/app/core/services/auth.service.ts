import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { User, Session } from '@supabase/supabase-js';

export interface Profile {
  id: string;
  email: string;
  name: string;
  school: string;
  governorate: string;
  subject: string;
  grades: string;
  experience: string;
  role: 'user' | 'admin';
  is_active: boolean;
  monthly_limit: number;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(null);
  private _profile = signal<Profile | null>(null);
  private _loading = signal(true);

  user = this._user.asReadonly();
  profile = this._profile.asReadonly();
  loading = this._loading.asReadonly();
  isLoggedIn = computed(() => !!this._user());
  isAdmin = computed(() => this._profile()?.role === 'admin');

  constructor(
    private sb: SupabaseService,
    private router: Router,
  ) {
    this.initAuth();
  }

  private async initAuth() {
    try {
      const {
        data: { session },
      } = await this.sb.auth.getSession();
      if (session) {
        this._user.set(session.user);
        await this.loadProfile(session.user.id);
      }
    } catch (err) {
      console.error('Auth init error:', err);
    } finally {
      this._loading.set(false);
    }

    this.sb.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        this._user.set(session.user);
        await this.loadProfile(session.user.id);
      } else {
        this._user.set(null);
        this._profile.set(null);
      }
    });

    // Refresh session when user returns to the tab
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.sb.auth.startAutoRefresh();
      } else {
        this.sb.auth.stopAutoRefresh();
      }
    });
  }

  /** Resolves once the initial session check is done */
  async waitUntilReady(): Promise<void> {
    if (!this._loading()) return;
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (!this._loading()) {
          clearInterval(check);
          resolve();
        }
      }, 50);
    });
  }

  private async loadProfile(userId: string) {
    const { data } = await this.sb.supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) this._profile.set(data as Profile);
  }

  async signIn(email: string, password: string): Promise<string | null> {
    const { error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error) {
      return error.message.includes('Invalid login') ? 'بيانات الدخول غير صحيحة' : error.message;
    }

    // Check if user is disabled
    const { data: profile } = await this.sb.supabase
      .from('profiles')
      .select('is_active')
      .eq('id', (await this.sb.auth.getUser()).data.user?.id)
      .single();

    if (profile && !profile.is_active) {
      await this.sb.auth.signOut();
      return 'تم تعطيل حسابك. تواصل مع المسؤول.';
    }

    return null;
  }

  async signUp(
    email: string,
    password: string,
    meta: { name: string; school: string; governorate: string },
  ): Promise<{ error: string | null; needsConfirmation: boolean }> {
    const { data, error } = await this.sb.auth.signUp({
      email,
      password,
      options: { data: meta },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        return { error: 'هذا البريد مسجل بالفعل. جرب تسجيل الدخول.', needsConfirmation: false };
      }
      return { error: error.message, needsConfirmation: false };
    }

    if (data.user && !data.session) {
      return { error: null, needsConfirmation: true };
    }

    // Auto-confirmed — update profile
    if (data.user) {
      await this.sb.supabase
        .from('profiles')
        .update({ name: meta.name, school: meta.school, governorate: meta.governorate })
        .eq('id', data.user.id);
      await this.loadProfile(data.user.id);
    }

    return { error: null, needsConfirmation: false };
  }

  async signOut() {
    await this.sb.auth.signOut();
    this._user.set(null);
    this._profile.set(null);
    this.router.navigate(['/login']);
  }

  async updateProfile(updates: Partial<Profile>) {
    const user = this._user();
    if (!user) return;
    const { error } = await this.sb.supabase.from('profiles').update(updates).eq('id', user.id);
    if (!error) {
      this._profile.update((p) => (p ? { ...p, ...updates } : p));
    }
    return error;
  }

  async reloadProfile() {
    const user = this._user();
    if (user) await this.loadProfile(user.id);
  }
}
