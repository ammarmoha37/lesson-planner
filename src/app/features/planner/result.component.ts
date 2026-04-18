import { Component, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MarkdownPipe } from '../../shared/pipes/markdown.pipe';
import { ToastService } from '../../shared/services/toast.service';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [MarkdownPipe],
  template: `
    @if (text()) {
      <div class="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <!-- Header -->
        <div
          class="bg-gradient-to-l from-primary-dark to-primary p-5 text-white flex flex-col sm:flex-row sm:items-center gap-4"
        >
          <div class="flex-1">
            <h2 class="font-display text-xl font-bold">{{ meta.title }}</h2>
            <p class="text-sm text-white/70 mt-0.5">
              {{ meta.subject }} — {{ meta.grade }} | {{ meta.semester }} | {{ today }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button (click)="printResult()" class="res-btn">🖨️ طباعة</button>
            <button (click)="copyResult()" class="res-btn">📋 نسخ</button>
            <button (click)="exportPDF()" class="res-btn">📄 PDF</button>
            <button (click)="toggleEdit()" class="res-btn">
              {{ editing() ? '✅ حفظ' : '✏️ تعديل' }}
            </button>
            <button (click)="newPlan()" class="res-btn bg-white/20">✨ جديد</button>
          </div>
        </div>

        <!-- Body -->
        <div
          class="p-6 result-body"
          [contentEditable]="editing()"
          [class.ring-2]="editing()"
          [class.ring-primary-light]="editing()"
          [class.ring-dashed]="editing()"
          [class.rounded-lg]="editing()"
          [innerHTML]="text() | markdown"
          #resultBody
        ></div>
      </div>
    } @else {
      <div class="text-center py-20">
        <div class="text-5xl mb-4">📄</div>
        <p class="text-muted">لا يوجد تحضير لعرضه. أنشئ تحضيراً جديداً.</p>
        <button
          (click)="newPlan()"
          class="mt-4 px-6 py-2.5 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-light transition"
        >
          ✏️ تحضير جديد
        </button>
      </div>
    }
  `,
  styles: [
    `
      @reference "../../../styles.scss";
      .font-display {
        font-family: 'Cairo', sans-serif;
      }
      .res-btn {
        @apply px-3.5 py-1.5 bg-white/10 border border-white/20 text-white text-sm rounded-lg hover:bg-white/20 transition cursor-pointer;
      }
      :host ::ng-deep .result-body {
        h1 {
          @apply font-bold text-xl text-primary mt-6 mb-2 pb-1.5 border-b-2 border-primary-bg;
          font-family: 'Cairo', sans-serif;
        }
        h1:first-child {
          @apply mt-0;
        }
        h2 {
          @apply font-bold text-sm text-primary-dark mt-5 mb-2 py-2 px-3 bg-primary-bg border-r-4 border-primary rounded-l-lg;
          font-family: 'Cairo', sans-serif;
        }
        h3 {
          @apply text-sm font-bold text-primary-light mt-4 mb-1.5 pr-2.5 border-r-[3px] border-primary-border;
          font-family: 'Cairo', sans-serif;
        }
        p {
          @apply mb-2 leading-relaxed text-sm;
        }
        ul {
          @apply pr-5 mb-3;
        }
        li {
          @apply mb-1 text-sm;
        }
        strong {
          @apply text-primary;
        }
        hr {
          @apply border-t border-dashed border-border my-4;
        }
        table {
          @apply w-full border-collapse my-3 text-xs rounded-lg overflow-hidden;
        }
        th {
          @apply bg-primary text-white py-2 px-3 text-right font-semibold;
        }
        td {
          @apply py-2 px-3 border border-primary-border;
        }
        tr:nth-child(even) td {
          @apply bg-primary-bg/40;
        }
      }
    `,
  ],
})
export class ResultComponent implements OnInit {
  text = signal('');
  editing = signal(false);
  meta: any = {};
  today = new Date().toLocaleDateString('ar-OM');

  constructor(
    private router: Router,
    private toast: ToastService,
  ) {}

  ngOnInit() {
    const state = history.state;
    if (state?.text) {
      this.text.set(state.text);
      this.meta = state.meta || {};
    }
  }

  async copyResult() {
    await navigator.clipboard.writeText(this.text());
    this.toast.show('📋 تم نسخ التحضير');
  }

  toggleEdit() {
    this.editing.update((v) => !v);
    this.toast.show(
      this.editing() ? '✏️ وضع التعديل — عدّل مباشرة في النص' : '✅ تم حفظ التعديلات',
    );
  }

  printResult() {
    window.print();
  }

  newPlan() {
    this.router.navigate(['/app']);
  }

  exportPDF() {
    const content = document.querySelector('.result-body')?.innerHTML;
    if (!content) return;

    const title = this.meta.title || 'تحضير الدرس';
    const date = this.meta.date || this.today;
    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) {
      this.toast.show('⚠️ السماح بالنوافذ المنبثقة من إعدادات المتصفح');
      return;
    }

    printWin.document
      .write(`<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>${title}</title>
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&family=Cairo:wght@600;700&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Tajawal',sans-serif;direction:rtl;color:#1a1a1a;font-size:13px;line-height:1.85;background:#fff}
.print-header{background:#1a6b4a;color:#fff;padding:14px 24px;display:flex;align-items:center;justify-content:space-between}
.print-header h1{font-family:'Cairo',sans-serif;font-size:17px;font-weight:700}.print-header .meta{font-size:12px;opacity:0.82;text-align:left}
.info-bar{background:#e8f5ef;border-bottom:2px solid #c5e0d4;padding:8px 24px;display:flex;gap:20px;font-size:12px;color:#1a6b4a;font-weight:500}
.content{padding:20px 28px}h1{font-family:'Cairo',sans-serif;color:#1a6b4a;font-size:18px;margin:20px 0 8px;padding-bottom:6px;border-bottom:2px solid #e8f5ef}
h1:first-child{margin-top:0}h2{font-family:'Cairo',sans-serif;color:#0a3d2b;font-size:14.5px;margin:18px 0 7px;padding:7px 13px;background:#e8f5ef;border-right:4px solid #1a6b4a;border-radius:0 7px 7px 0}
h3{font-family:'Cairo',sans-serif;color:#2d9566;font-size:13px;margin:14px 0 5px;padding-right:10px;border-right:3px solid #c5e0d4}
p{margin-bottom:7px}ul,ol{padding-right:20px;margin-bottom:8px}li{margin-bottom:3px}strong{color:#1a6b4a}hr{border:none;border-top:1.5px dashed #ddd9d0;margin:14px 0}
table{width:100%;border-collapse:collapse;margin:12px 0;font-size:12px;border-radius:6px;overflow:hidden}
th{background:#1a6b4a;color:#fff;padding:8px 12px;text-align:right;font-weight:600}td{padding:7px 12px;border:1px solid #c5e0d4}
tr:nth-child(even) td{background:#f0faf5}@page{size:A4;margin:0}@media print{body{padding-bottom:28px}.no-print{display:none!important}h2,h3{page-break-after:avoid}table{page-break-inside:avoid}}
.print-btn-bar{position:fixed;top:10px;left:50%;transform:translateX(-50%);display:flex;gap:10px;z-index:999;background:rgba(255,255,255,0.95);padding:8px 16px;border-radius:30px;box-shadow:0 2px 16px rgba(0,0,0,0.15)}
.pbtn{font-family:'Tajawal',sans-serif;font-size:14px;font-weight:600;padding:9px 22px;border-radius:8px;border:none;cursor:pointer}
.pbtn-p{background:#1a6b4a;color:#fff}.pbtn-c{background:#f4f2ec;color:#1a1a1a;border:1px solid #ddd}</style></head><body>
<div class="print-btn-bar no-print"><button class="pbtn pbtn-p" onclick="window.print()">🖨️ طباعة / حفظ PDF</button><button class="pbtn pbtn-c" onclick="window.close()">✕ إغلاق</button></div>
<div class="print-header"><h1>📚 محضّر الدروس — ${title}</h1><div class="meta">${this.meta.subject || ''} | ${this.meta.grade || ''}<br>${date}</div></div>
<div class="info-bar"><span>📚 ${this.meta.subject || ''}</span><span>🎓 ${this.meta.grade || ''}</span>${this.meta.unit ? `<span>📖 ${this.meta.unit}</span>` : ''}<span>📅 ${date}</span><span>⏰ ${this.meta.periods || '1'} حصة</span></div>
<div class="content">${content}</div></body></html>`);
    printWin.document.close();
    this.toast.show('✅ فُتحت نافذة الطباعة');
  }
}
