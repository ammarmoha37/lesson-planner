import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <form (ngSubmit)="login()" class="text-right space-y-4">
      <div>
        <label class="block text-sm font-semibold mb-1">البريد الإلكتروني</label>
        <input
          type="email"
          [(ngModel)]="email"
          name="email"
          required
          autocomplete="email"
          dir="ltr"
          placeholder="example&#64;email.com"
          class="w-full px-4 py-2.5 border-2 border-border rounded-xl bg-surface text-sm focus:border-primary focus:bg-card outline-none transition"
        />
      </div>
      <div>
        <label class="block text-sm font-semibold mb-1">كلمة المرور</label>
        <input
          type="password"
          [(ngModel)]="password"
          name="password"
          required
          autocomplete="current-password"
          dir="ltr"
          placeholder="كلمة المرور"
          class="w-full px-4 py-2.5 border-2 border-border rounded-xl bg-surface text-sm focus:border-primary focus:bg-card outline-none transition"
        />
      </div>

      @if (error()) {
        <div
          class="bg-danger-bg text-danger border border-danger/20 rounded-xl px-4 py-2.5 text-sm text-right"
        >
          {{ error() }}
        </div>
      }

      <button
        type="submit"
        [disabled]="loading()"
        class="w-full py-3 bg-primary text-white rounded-xl font-display font-bold text-base hover:bg-primary-light transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
      >
        {{ loading() ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول' }}
      </button>
    </form>

    <div class="flex items-center gap-3 my-5 text-muted text-sm">
      <div class="flex-1 h-px bg-border"></div>
      أو
      <div class="flex-1 h-px bg-border"></div>
    </div>

    <p class="text-sm text-muted">
      ليس لديك حساب؟
      <a routerLink="/signup" class="text-primary font-bold hover:underline">إنشاء حساب جديد</a>
    </p>
  `,
  styles: [
    `
      .font-display {
        font-family: 'Cairo', sans-serif;
      }
    `,
  ],
})
export class LoginComponent {
  email = '';
  password = '';
  error = signal('');
  loading = signal(false);

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {
    if (auth.isLoggedIn()) this.router.navigate(['/app']);
  }

  async login() {
    this.error.set('');
    this.loading.set(true);
    const err = await this.auth.signIn(this.email, this.password);
    this.loading.set(false);
    if (err) {
      this.error.set(err);
    } else {
      this.router.navigate(['/app']);
    }
  }
}
