import { Component, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LessonService, LessonPlan } from '../../core/services/lesson.service';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [],
  template: `
    <div class="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <div
        class="bg-surface px-5 py-3.5 border-b border-border font-display font-bold text-base flex items-center gap-2"
      >
        📂 <span>التحضيرات المحفوظة</span>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4 p-5 border-b border-border">
        <div class="bg-surface rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-primary">{{ plans().length }}</div>
          <div class="text-xs text-muted">إجمالي التحضيرات</div>
        </div>
        <div class="bg-surface rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-primary">{{ uniqueSubjects() }}</div>
          <div class="text-xs text-muted">مادة مختلفة</div>
        </div>
        <div class="bg-surface rounded-xl p-3 text-center">
          <div class="text-2xl font-bold text-primary">{{ recentCount() }}</div>
          <div class="text-xs text-muted">هذا الأسبوع</div>
        </div>
      </div>

      <div class="p-5">
        @if (loadingPlans()) {
          <div class="text-center py-10 text-muted">جارٍ التحميل...</div>
        } @else if (plans().length === 0) {
          <div class="text-center py-10">
            <div class="text-5xl mb-3">📂</div>
            <p class="text-muted">
              لا توجد تحضيرات محفوظة بعد.<br />أنشئ تحضيراً جديداً وستظهر هنا.
            </p>
          </div>
        } @else {
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            @for (plan of plans(); track plan.id) {
              <div
                class="bg-surface rounded-xl border border-border p-4 hover:shadow-md transition"
              >
                <div class="flex items-start justify-between mb-2">
                  <h3 class="font-semibold text-sm">{{ plan.title }}</h3>
                  <span
                    class="bg-primary-bg text-primary text-xs px-2 py-0.5 rounded-full shrink-0"
                    >{{ plan.subject }}</span
                  >
                </div>
                <p class="text-xs text-muted mb-3">
                  {{ plan.grade }}{{ plan.unit ? ' | ' + plan.unit : '' }}
                </p>
                <div class="text-xs text-muted flex gap-3 mb-3">
                  <span>📅 {{ formatDate(plan.created_at) }}</span>
                  <span>⏰ {{ plan.periods || '1' }} حصة</span>
                </div>
                <div class="flex gap-2">
                  <button (click)="viewPlan(plan)" class="action-btn">👁️ عرض</button>
                  <button (click)="copyPlan(plan)" class="action-btn">📋 نسخ</button>
                  <button
                    (click)="deletePlan(plan)"
                    class="action-btn text-danger hover:bg-danger-bg"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      @reference "../../../styles.scss";
      .font-display {
        font-family: 'Cairo', sans-serif;
      }
      .action-btn {
        @apply px-3 py-1 bg-card border border-border rounded-lg text-xs cursor-pointer hover:bg-primary-bg hover:border-primary-border transition;
      }
    `,
  ],
})
export class HistoryComponent implements OnInit {
  plans = signal<LessonPlan[]>([]);
  loadingPlans = signal(true);
  uniqueSubjects = signal(0);
  recentCount = signal(0);

  constructor(
    private lessons: LessonService,
    private toast: ToastService,
    private router: Router,
  ) {}

  async ngOnInit() {
    await this.loadPlans();
  }

  async loadPlans() {
    this.loadingPlans.set(true);
    const data = await this.lessons.getPlans();
    this.plans.set(data);
    this.uniqueSubjects.set(new Set(data.map((p) => p.subject)).size);
    const weekAgo = Date.now() - 7 * 86400000;
    this.recentCount.set(
      data.filter((p) => new Date(p.created_at || 0).getTime() > weekAgo).length,
    );
    this.loadingPlans.set(false);
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ar-OM');
  }

  viewPlan(plan: LessonPlan) {
    this.router.navigate(['/app/result'], {
      state: {
        text: plan.plan_text,
        meta: {
          subject: plan.subject,
          grade: plan.grade,
          title: plan.title,
          unit: plan.unit,
          date: plan.date,
          periods: plan.periods,
          semester: plan.semester,
        },
      },
    });
  }

  async copyPlan(plan: LessonPlan) {
    await navigator.clipboard.writeText(plan.plan_text);
    this.toast.show('📋 تم نسخ التحضير');
  }

  async deletePlan(plan: LessonPlan) {
    if (!confirm('هل تريد حذف هذا التحضير؟')) return;
    if (!plan.id) return;
    const { error } = await this.lessons.deletePlan(plan.id);
    if (error) {
      this.toast.show('❌ ' + error);
    } else {
      this.toast.show('🗑️ تم الحذف');
      await this.loadPlans();
    }
  }
}
