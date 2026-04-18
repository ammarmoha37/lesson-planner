import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, Profile } from '../../core/services/auth.service';
import { ProfileService, UsageStats } from '../../core/services/profile.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-5">
      <!-- Usage Stats -->
      <div class="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div
          class="bg-surface px-5 py-3.5 border-b border-border font-display font-bold text-base flex items-center gap-2"
        >
          📊 <span>إحصائيات الاستخدام</span>
        </div>
        <div class="grid grid-cols-3 gap-4 p-5">
          <div class="bg-surface rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-primary">{{ usage()?.lesson_count || 0 }}</div>
            <div class="text-xs text-muted">تحضيرات هذا الشهر</div>
          </div>
          <div class="bg-surface rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-gold">{{ profile()?.monthly_limit || 50 }}</div>
            <div class="text-xs text-muted">الحد الشهري</div>
          </div>
          <div class="bg-surface rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-primary-light">{{ remaining() }}</div>
            <div class="text-xs text-muted">متبقي</div>
          </div>
        </div>
      </div>

      <!-- Profile Form -->
      <div class="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div
          class="bg-surface px-5 py-3.5 border-b border-border font-display font-bold text-base flex items-center gap-2"
        >
          👤 <span>الملف الشخصي</span>
        </div>
        <div class="p-5 space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="label">الاسم الكامل</label
              ><input [(ngModel)]="name" class="input-field" />
            </div>
            <div>
              <label class="label">البريد الإلكتروني</label
              ><input [value]="profile()?.email || ''" class="input-field bg-surface" disabled />
            </div>
            <div>
              <label class="label">المدرسة</label><input [(ngModel)]="school" class="input-field" />
            </div>
            <div>
              <label class="label">المحافظة</label>
              <select [(ngModel)]="governorate" class="input-field">
                <option value="">— اختر —</option>
                @for (g of governorates; track g) {
                  <option [value]="g">{{ g }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label">التخصص / المادة</label
              ><input [(ngModel)]="subject" class="input-field" />
            </div>
            <div>
              <label class="label">سنوات الخبرة</label
              ><input [(ngModel)]="experience" class="input-field" placeholder="مثال: 5" />
            </div>
            <div class="sm:col-span-2">
              <label class="label">الصفوف التي تدرّسها</label
              ><input
                [(ngModel)]="grades"
                class="input-field"
                placeholder="مثال: الصف السابع، الصف الثامن"
              />
            </div>
          </div>
          <button
            (click)="saveProfile()"
            [disabled]="saving()"
            class="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-light transition disabled:opacity-50"
          >
            {{ saving() ? 'جارٍ الحفظ...' : '💾 حفظ التغييرات' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      @reference "../../../styles.scss";
      .font-display {
        font-family: 'Cairo', sans-serif;
      }
      .label {
        @apply block text-sm font-semibold mb-1.5;
      }
      .input-field {
        @apply w-full px-3.5 py-2.5 border-2 border-border rounded-xl bg-surface text-sm focus:border-primary focus:bg-card outline-none transition;
      }
    `,
  ],
})
export class ProfileComponent implements OnInit {
  usage = signal<UsageStats | null>(null);
  saving = signal(false);

  get profile() {
    return this.auth.profile;
  }

  name = '';
  school = '';
  governorate = '';
  subject = '';
  experience = '';
  grades = '';

  governorates = [
    'مسقط',
    'ظفار',
    'مسندم',
    'البريمي',
    'الداخلية',
    'شمال الباطنة',
    'جنوب الباطنة',
    'شمال الشرقية',
    'جنوب الشرقية',
    'الظاهرة',
    'الوسطى',
  ];

  constructor(
    private auth: AuthService,
    private profileSvc: ProfileService,
    private toast: ToastService,
  ) {}

  async ngOnInit() {
    const p = this.profile();
    if (p) {
      this.name = p.name || '';
      this.school = p.school || '';
      this.governorate = p.governorate || '';
      this.subject = p.subject || '';
      this.experience = p.experience || '';
      this.grades = p.grades || '';
    }
    this.loadUsage();
  }

  remaining(): number {
    const limit = this.profile()?.monthly_limit || 50;
    const used = this.usage()?.lesson_count || 0;
    return Math.max(0, limit - used);
  }

  async loadUsage() {
    const stats = await this.profileSvc.getMyUsage();
    this.usage.set(stats);
  }

  async saveProfile() {
    this.saving.set(true);
    const error = await this.profileSvc.updateProfile({
      name: this.name,
      school: this.school,
      governorate: this.governorate,
      subject: this.subject,
      experience: this.experience,
      grades: this.grades,
    });
    this.saving.set(false);
    if (error) {
      this.toast.show('❌ ' + error);
    } else {
      await this.auth.reloadProfile();
      this.toast.show('✅ تم حفظ الملف الشخصي');
    }
  }
}
