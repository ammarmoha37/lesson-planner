import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AiService, PlanFormData } from '../../core/services/ai.service';
import { LessonService } from '../../core/services/lesson.service';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-form-wizard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './form-wizard.component.html',
  styleUrl: './form-wizard.component.scss',
})
export class FormWizardComponent {
  step = signal(1);
  loading = signal(false);
  progress = signal(0);
  progressMsg = signal('يتم تحليل متطلبات المنهج العُماني...');

  // Page 1
  subject = '';
  grade = '';
  unit = '';
  chapter = '';
  lessonTitle = '';
  semester = 'الفصل الأول';
  periods = '1';
  classSize = '30–35';
  lessonDate = '';
  extra = '';

  // Page 2
  strategies: string[] = [];
  assessments: string[] = ['ملاحظة مباشرة', 'ورقة عمل', 'مناقشة شفهية', 'بطاقة خروج'];
  skills: string[] = [];
  studentLevel = 'متوسط';
  tech = 'سبورة تقليدية فقط';

  // Page 3
  detail = 'standard';
  integration = 'yes';
  lang = 'ar';
  timing = 'flex';
  extras: string[] = [
    'ورقة عمل للطلاب',
    'واجب منزلي',
    'أسئلة تقويم متنوعة',
    'التأمل الذاتي للمعلم',
  ];

  // Dropdowns
  subjects = [
    'اللغة العربية',
    'التربية الإسلامية',
    'الرياضيات',
    'العلوم',
    'الدراسات الاجتماعية',
    'اللغة الإنجليزية',
    'الفيزياء',
    'الكيمياء',
    'الأحياء',
    'التاريخ',
    'الجغرافيا',
    'الحاسوب والتقنية',
    'التربية الفنية',
    'التربية البدنية',
    'أخرى',
  ];
  grades = [
    'الصف الخامس',
    'الصف السادس',
    'الصف السابع',
    'الصف الثامن',
    'الصف التاسع',
    'الصف العاشر',
    'الصف الحادي عشر',
    'الصف الثاني عشر',
  ];

  allStrategies = [
    'التعلم التعاوني',
    'حل المشكلات',
    'العصف الذهني',
    'الاستقصاء والبحث',
    'التعلم المتمايز',
    'القصة والسرد',
    'التعلم بالمشروع',
    'لعب الأدوار',
    'التعليم المباشر',
    'الفصل المعكوس',
  ];
  allAssessments = [
    'ملاحظة مباشرة',
    'اختبار قصير',
    'ورقة عمل',
    'مشروع',
    'مناقشة شفهية',
    'تقييم الأقران',
    'بطاقة خروج',
    'سلم تقدير',
    'قائمة رصد',
  ];
  allSkills = [
    'التفكير النقدي',
    'الإبداع والابتكار',
    'التواصل الفعّال',
    'التعاون وروح الفريق',
    'التقنية الرقمية',
    'حل المشكلات',
  ];
  allExtras = [
    { v: 'ورقة عمل للطلاب', l: '📝 ورقة عمل' },
    { v: 'واجب منزلي', l: '🏠 واجب منزلي' },
    { v: 'أسئلة تقويم متنوعة', l: '❓ أسئلة تقويم' },
    { v: 'تمييز بين مستويات الطلاب', l: '🌟 تمييز المستويات' },
    { v: 'ربط بمواد أخرى', l: '🔗 تكامل معرفي' },
    { v: 'التأمل الذاتي للمعلم', l: '🔍 تأمل ذاتي' },
    { v: 'أنشطة إثرائية للمتقدمين', l: '🚀 إثراء للمتقدمين' },
    { v: 'أنشطة دعم للمتأخرين', l: '🤝 دعم المتأخرين' },
    { v: 'وسائل تعليمية رقمية مقترحة', l: '💻 وسائل رقمية' },
    { v: 'ربط برؤية عُمان 2040', l: '🇴🇲 رؤية 2040' },
    { v: 'أسئلة تفكير ناقد', l: '🧠 تفكير ناقد' },
  ];

  private progressInterval: any;

  constructor(
    private ai: AiService,
    private lessons: LessonService,
    private toast: ToastService,
    private router: Router,
    private auth: AuthService,
  ) {
    const prof = this.auth.profile();
    if (prof?.subject) this.subject = prof.subject;
    this.lessonDate = new Date().toISOString().split('T')[0];
  }

  goStep(n: number) {
    this.step.set(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleItem(arr: string[], item: string) {
    const idx = arr.indexOf(item);
    if (idx > -1) arr.splice(idx, 1);
    else arr.push(item);
  }

  hasItem(arr: string[], item: string): boolean {
    return arr.includes(item);
  }

  async generate() {
    if (!this.subject || !this.grade || !this.lessonTitle.trim()) {
      this.toast.show('⚠️ يرجى ملء المادة والصف وعنوان الدرس');
      this.goStep(1);
      return;
    }

    this.loading.set(true);
    this.progress.set(0);
    this.startProgress();

    const form: PlanFormData = {
      subject: this.subject,
      grade: this.grade,
      title: this.lessonTitle.trim(),
      unit: this.unit,
      chapter: this.chapter,
      periods: this.periods,
      date: this.lessonDate,
      semester: this.semester,
      classSize: this.classSize,
      extra: this.extra,
      strategies: this.strategies,
      assessments: this.assessments,
      skills: this.skills,
      extras: this.extras,
      detail: this.detail,
      integration: this.integration,
      lang: this.lang,
      timing: this.timing,
      studentLevel: this.studentLevel,
      tech: this.tech,
    };

    try {
      const res = await this.ai.generate(form);
      this.stopProgress();
      if (!res.success) throw new Error(res.error || 'فشل في إنشاء التحضير');

      // Dismiss loading immediately
      this.loading.set(false);

      // Save to Supabase - fire the request before navigating
      const savePromise = this.lessons.savePlan({
        title: form.title,
        subject: form.subject,
        grade: form.grade,
        unit: form.unit,
        semester: form.semester,
        periods: form.periods,
        date: form.date,
        plan_text: res.text,
      });

      // Wait for save to complete before navigating
      const saveResult = await savePromise;
      if (saveResult.error) {
        console.error('Save error:', saveResult.error);
      } else {
        console.log('Plan saved successfully');
      }

      // Navigate to result with data
      this.router.navigate(['/app/result'], {
        state: {
          text: res.text,
          meta: {
            subject: form.subject,
            grade: form.grade,
            title: form.title,
            unit: form.unit,
            date: form.date,
            periods: form.periods,
            semester: form.semester,
          },
        },
      });
    } catch (e: any) {
      this.stopProgress();
      this.toast.show('❌ خطأ: ' + (e.message || 'حاول مجدداً'));
    } finally {
      this.loading.set(false);
    }
  }

  private startProgress() {
    const msgs = [
      'يتم تحليل متطلبات المنهج العُماني...',
      'يتم صياغة نتائج التعلم وفق تصنيف بلوم...',
      'يتم تصميم خطوات سير الدرس...',
      'يتم إعداد الأنشطة والأمثلة العُمانية...',
      'يتم إعداد أدوات التقويم...',
      'اللمسات الأخيرة على التحضير...',
    ];
    let i = 0;
    this.progressInterval = setInterval(() => {
      this.progress.update((w) => Math.min(w + Math.random() * 10, 88));
      if (i < msgs.length) this.progressMsg.set(msgs[i++]);
    }, 1300);
  }

  private stopProgress() {
    clearInterval(this.progressInterval);
    this.progress.set(100);
  }
}
