import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <form (ngSubmit)="signup()" class="text-right space-y-3">
      <div>
        <label class="block text-sm font-semibold mb-1">الاسم الكامل</label>
        <input
          type="text"
          [(ngModel)]="name"
          name="name"
          required
          placeholder="اسم المعلم / المعلمة"
          class="input-field"
        />
      </div>
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
          class="input-field"
        />
      </div>
      <div>
        <label class="block text-sm font-semibold mb-1">كلمة المرور</label>
        <input
          type="password"
          [(ngModel)]="password"
          name="password"
          required
          minlength="6"
          autocomplete="new-password"
          dir="ltr"
          placeholder="6 أحرف على الأقل"
          class="input-field"
        />
      </div>
      <div>
        <label class="block text-sm font-semibold mb-1">المدرسة</label>
        <input
          type="text"
          [(ngModel)]="school"
          name="school"
          placeholder="اسم المدرسة"
          class="input-field"
        />
      </div>
      <div>
        <label class="block text-sm font-semibold mb-1">المحافظة</label>
        <select [(ngModel)]="governorate" name="gov" class="input-field">
          <option value="">— اختر —</option>
          @for (g of governorates; track g) {
            <option [value]="g">{{ g }}</option>
          }
        </select>
      </div>

      @if (error()) {
        <div
          class="bg-danger-bg text-danger border border-danger/20 rounded-xl px-4 py-2.5 text-sm text-right"
        >
          {{ error() }}
        </div>
      }
      @if (success()) {
        <div
          class="bg-primary-bg text-primary border border-primary-border rounded-xl px-4 py-2.5 text-sm text-right"
        >
          {{ success() }}
        </div>
      }

      <button
        type="submit"
        [disabled]="loading()"
        class="w-full py-3 bg-primary text-white rounded-xl font-display font-bold text-base hover:bg-primary-light transition disabled:opacity-60 disabled:cursor-not-allowed mt-2"
      >
        {{ loading() ? 'جارٍ إنشاء الحساب...' : 'إنشاء حساب' }}
      </button>
    </form>

    <div class="flex items-center gap-3 my-5 text-muted text-sm">
      <div class="flex-1 h-px bg-border"></div>
      أو
      <div class="flex-1 h-px bg-border"></div>
    </div>

    <p class="text-sm text-muted">
      لديك حساب؟
      <a routerLink="/login" class="text-primary font-bold hover:underline">تسجيل الدخول</a>
    </p>
  `,
  styles: [
    `
      @reference "../../../styles.scss";
      .font-display {
        font-family: 'Cairo', sans-serif;
      }
      .input-field {
        @apply w-full px-4 py-2.5 border-2 border-border rounded-xl bg-surface text-sm focus:border-primary focus:bg-card outline-none transition;
      }
    `,
  ],
})
export class SignupComponent {
  name = '';
  email = '';
  password = '';
  school = '';
  governorate = '';
  error = signal('');
  success = signal('');
  loading = signal(false);

  governorates = [
    'محافظة مسقط',
    'محافظة الداخلية',
    'محافظة الباطنة شمال',
    'محافظة الباطنة جنوب',
    'محافظة الشرقية شمال',
    'محافظة الشرقية جنوب',
    'محافظة الظاهرة',
    'محافظة الوسطى',
    'محافظة ظفار',
    'محافظة البريمي',
    'محافظة مسندم',
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  async signup() {
    this.error.set('');
    this.success.set('');
    this.loading.set(true);
    const result = await this.auth.signUp(this.email, this.password, {
      name: this.name,
      school: this.school,
      governorate: this.governorate,
    });
    this.loading.set(false);
    if (result.error) {
      this.error.set(result.error);
    } else if (result.needsConfirmation) {
      this.success.set('✅ تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتأكيد الحساب.');
    } else {
      this.router.navigate(['/app']);
    }
  }
}
