import { Component, OnInit, signal } from '@angular/core';
import { AdminService, SystemStats, AdminUser, UsageRow } from '../../core/services/admin.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  template: `
    <div class="space-y-5">
      <!-- Stats -->
      <div class="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div
          class="bg-gradient-to-l from-primary-dark to-primary px-5 py-3.5 text-white font-display font-bold text-base flex items-center gap-2"
        >
          🛡️ <span>لوحة الإدارة</span>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5">
          <div class="bg-surface rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-primary">{{ stats()?.total_users || 0 }}</div>
            <div class="text-xs text-muted">المستخدمين</div>
          </div>
          <div class="bg-surface rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-primary-light">
              {{ stats()?.active_today || 0 }}
            </div>
            <div class="text-xs text-muted">النشطين</div>
          </div>
          <div class="bg-surface rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-gold">{{ stats()?.total_plans || 0 }}</div>
            <div class="text-xs text-muted">تحضيرات</div>
          </div>
          <div class="bg-surface rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-danger">
              {{ stats()?.monthly_cost?.toFixed(2) || '0.00' }} $
            </div>
            <div class="text-xs text-muted">تكلفة الشهر</div>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div
          class="bg-surface px-5 py-3.5 border-b border-border font-display font-bold text-base flex items-center gap-2"
        >
          👥 <span>المستخدمون</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-surface border-b border-border">
                <th class="px-4 py-2.5 text-right font-semibold text-xs text-muted">الاسم</th>
                <th class="px-4 py-2.5 text-right font-semibold text-xs text-muted">البريد</th>
                <th class="px-4 py-2.5 text-right font-semibold text-xs text-muted">المدرسة</th>
                <th class="px-4 py-2.5 text-right font-semibold text-xs text-muted">تحضيرات</th>
                <th class="px-4 py-2.5 text-right font-semibold text-xs text-muted">التوكنز</th>
                <th class="px-4 py-2.5 text-right font-semibold text-xs text-muted">التكلفة</th>
                <th class="px-4 py-2.5 text-right font-semibold text-xs text-muted">الحد</th>
                <th class="px-4 py-2.5 text-right font-semibold text-xs text-muted">الحالة</th>
                <th class="px-4 py-2.5 text-right font-semibold text-xs text-muted">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              @for (u of users(); track u.id) {
                <tr class="border-b border-border hover:bg-surface/50 transition">
                  <td class="px-4 py-2.5 font-semibold">{{ u.name || '—' }}</td>
                  <td class="px-4 py-2.5 text-xs text-muted">{{ u.email }}</td>
                  <td class="px-4 py-2.5 text-xs">{{ u.school || '—' }}</td>
                  <td class="px-4 py-2.5">
                    <span
                      class="bg-primary-bg text-primary px-2 py-0.5 rounded-full text-xs font-bold"
                      >{{ u.plan_count }}</span
                    >
                  </td>
                  <td class="px-4 py-2.5 text-xs">{{ u.total_tokens.toLocaleString() }}</td>
                  <td class="px-4 py-2.5 text-xs font-bold text-gold">
                    {{ u.total_cost.toFixed(3) }} $
                  </td>
                  <td class="px-4 py-2.5 text-xs">{{ u.monthly_limit }}</td>
                  <td class="px-4 py-2.5">
                    <span
                      class="px-2 py-0.5 rounded-full text-xs font-semibold"
                      [class]="
                        u.is_active ? 'bg-primary-bg text-primary' : 'bg-danger-bg text-danger'
                      "
                    >
                      {{ u.is_active ? 'فعّال' : 'معطّل' }}
                    </span>
                  </td>
                  <td class="px-4 py-2.5">
                    <div class="flex gap-1.5">
                      <button
                        (click)="toggleUser(u)"
                        class="px-2 py-1 border border-border rounded-lg text-xs hover:bg-surface transition cursor-pointer"
                      >
                        {{ u.is_active ? '🔒' : '🔓' }}
                      </button>
                      <button
                        (click)="changeLimit(u)"
                        class="px-2 py-1 border border-border rounded-lg text-xs hover:bg-surface transition cursor-pointer"
                      >
                        📊
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Monthly Usage -->
      <div class="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div
          class="bg-surface px-5 py-3.5 border-b border-border font-display font-bold text-base flex items-center gap-2"
        >
          💰 <span>استخدام الشهر الحالي</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-surface border-b border-border">
                <th class="px-4 py-2.5 text-right font-semibold text-xs text-muted">المستخدم</th>
                <th class="px-4 py-2.5 text-right font-semibold text-xs text-muted">التوكنز</th>
                <th class="px-4 py-2.5 text-right font-semibold text-xs text-muted">التكلفة</th>
                <th class="px-4 py-2.5 text-right font-semibold text-xs text-muted">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              @for (row of usageRows(); track $index) {
                <tr class="border-b border-border">
                  <td class="px-4 py-2.5 font-semibold text-xs">
                    {{ row.profiles?.name || '—' }}
                  </td>
                  <td class="px-4 py-2.5 text-xs">{{ row.total_tokens.toLocaleString() }}</td>
                  <td class="px-4 py-2.5 text-xs font-bold text-gold">
                    {{ row.estimated_cost.toFixed(3) }} $
                  </td>
                  <td class="px-4 py-2.5 text-xs text-muted">{{ formatDate(row.created_at) }}</td>
                </tr>
              }
              @if (usageRows().length === 0) {
                <tr>
                  <td colspan="5" class="px-4 py-8 text-center text-muted">
                    لا توجد بيانات لهذا الشهر
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .font-display {
        font-family: 'Cairo', sans-serif;
      }
    `,
  ],
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<SystemStats | null>(null);
  users = signal<AdminUser[]>([]);
  usageRows = signal<UsageRow[]>([]);

  constructor(
    private admin: AdminService,
    private toast: ToastService,
  ) {}

  async ngOnInit() {
    await Promise.all([this.loadStats(), this.loadUsers(), this.loadUsage()]);
  }

  async loadStats() {
    const s = await this.admin.getSystemStats();
    this.stats.set(s);
  }

  async loadUsers() {
    const u = await this.admin.getAllUsers();
    this.users.set(u);
  }

  async loadUsage() {
    const r = await this.admin.getMonthlyUsage();
    this.usageRows.set(r);
  }

  async toggleUser(u: AdminUser) {
    const { error } = await this.admin.updateUserStatus(u.id, !u.is_active);
    if (error) {
      this.toast.show('❌ ' + error.message);
    } else {
      u.is_active = !u.is_active;
      this.toast.show(u.is_active ? '🔓 تم تفعيل المستخدم' : '🔒 تم تعطيل المستخدم');
    }
  }

  async changeLimit(u: AdminUser) {
    const input = prompt('الحد الشهري الجديد:', String(u.monthly_limit));
    if (!input) return;
    const val = parseInt(input);
    if (isNaN(val) || val < 0) {
      this.toast.show('⚠️ أدخل رقماً صحيحاً');
      return;
    }
    const { error } = await this.admin.updateUserLimit(u.id, val);
    if (error) {
      this.toast.show('❌ ' + error.message);
    } else {
      u.monthly_limit = val;
      this.toast.show('✅ تم تحديث الحد الشهري');
    }
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return (
      d.toLocaleDateString('en-OM') +
      ' ' +
      d.toLocaleTimeString('en-OM', { hour: '2-digit', minute: '2-digit' })
    );
  }
}
