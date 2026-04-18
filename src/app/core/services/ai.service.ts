import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

export interface PlanFormData {
  subject: string;
  grade: string;
  title: string;
  unit: string;
  chapter: string;
  periods: string;
  date: string;
  semester: string;
  classSize: string;
  extra: string;
  strategies: string[];
  assessments: string[];
  skills: string[];
  extras: string[];
  detail: string;
  integration: string;
  lang: string;
  timing: string;
  studentLevel: string;
  tech: string;
}

export interface GenerateResult {
  text: string;
  success: boolean;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class AiService {
  constructor(private auth: AuthService) {}

  buildPrompt(form: PlanFormData): string {
    const dlMap: Record<string, string> = {
      standard: 'مفصّل ومتوازن مناسب للطباعة',
      detailed: 'شامل جداً مع أمثلة وأنشطة واسعة',
      brief: 'مختصر وعملي',
    };
    const inMap: Record<string, string> = {
      yes: 'نعم، أدمج القيم الإسلامية والهوية العُمانية بشكل طبيعي',
      opt: 'حسب الحاجة',
      no: 'لا',
    };

    const prof = this.auth.profile();
    const tInfo = prof?.name
      ? `${prof.name}${prof.school ? ' — ' + prof.school : ''}${prof.governorate ? ' — ' + prof.governorate : ''}`
      : '';

    return `أنت خبير تربوي متخصص في المنهج الوطني العُماني. أعدّ تحضير درس كاملاً ومفصّلاً:

**بيانات الدرس:**
المادة: ${form.subject} | الصف: ${form.grade} | الفصل: ${form.semester}
الوحدة: ${form.unit || '—'} | الفصل/الدرس: ${form.chapter || '—'} | العنوان: ${form.title}
عدد الحصص: ${form.periods} (${+form.periods * 45} دقيقة) | الطلاب: ${form.classSize} | المستوى: ${form.studentLevel}
التقنية: ${form.tech} | مستوى التفاصيل: ${dlMap[form.detail] || dlMap['standard']}
التكامل العُماني: ${inMap[form.integration] || inMap['yes']}
${form.strategies.length ? 'الاستراتيجيات: ' + form.strategies.join('، ') : ''}
${form.assessments.length ? 'التقويم: ' + form.assessments.join('، ') : ''}
${form.skills.length ? 'مهارات القرن 21: ' + form.skills.join('، ') : ''}
${form.extras.length ? 'أقسام إضافية: ' + form.extras.join('، ') : ''}
${tInfo ? 'المعلم/ة: ' + tInfo : ''}
${form.extra ? 'ملاحظات: ' + form.extra : ''}

أنشئ تحضيراً كاملاً يتضمن:
# ${form.title}
## ${form.subject} | ${form.grade} | ${form.semester}

الأقسام المطلوبة:
- 📋 بطاقة معلومات الدرس (جدول)
- 🎯 نتائج التعلم المتوقعة (5-6 نتائج بأفعال بلوم)
- 💡 المفاهيم الأساسية والمصطلحات (جدول ثلاثي)
- 🛠️ الوسائل والمواد التعليمية
- 📖 استراتيجيات التدريس المختارة
- 🕐 خطوات سير الدرس التفصيلية (تهيئة، عرض، تطبيق، خاتمة مع توزيع زمني)
- 📊 منظومة التقويم (تشخيصي، تكويني، ختامي)
${form.extras.includes('واجب منزلي') ? '- 🏠 الواجب المنزلي' : ''}
${form.extras.includes('ورقة عمل للطلاب') ? '- 📝 ورقة عمل الطالب (جاهزة للطباعة مع 3 أنشطة متدرجة)' : ''}
${form.extras.includes('أسئلة تقويم متنوعة') ? '- ❓ بنك أسئلة التقويم (اختيار متعدد، صح/خطأ، تطبيقي، تفكير ناقد)' : ''}
${form.extras.includes('التأمل الذاتي للمعلم') ? '- 🔍 التأمل الذاتي للمعلم (جدول)' : ''}
${form.extras.includes('تمييز بين مستويات الطلاب') ? '- 🌟 التعلم المتمايز (متأخرين ومتقدمين)' : ''}
${form.extras.includes('ربط بمواد أخرى') ? '- 🔗 التكامل المعرفي مع المواد الأخرى' : ''}
${form.extras.includes('ربط برؤية عُمان 2040') ? '- 🇴🇲 الربط برؤية عُمان 2040' : ''}
${form.extras.includes('وسائل تعليمية رقمية مقترحة') ? '- 💻 الوسائل التعليمية الرقمية المقترحة' : ''}
${form.extras.includes('أسئلة تفكير ناقد') ? '- 🧠 أسئلة التفكير الناقد والإبداعي' : ''}

جميع الأمثلة مستوحاة من البيئة العُمانية ومناسبة لمستوى ${form.grade}.
${form.lang === 'en' ? 'Note: Write the entire lesson plan in English since this is an English Language lesson.' : 'اكتب بالعربية الفصحى.'}
استخدم تنسيق Markdown مع جداول وقوائم.`;
  }

  async generate(form: PlanFormData): Promise<GenerateResult> {
    const prompt = this.buildPrompt(form);
    const userId = this.auth.user()?.id;

    const response = await fetch(environment.generatePlanUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, userId }),
    });

    if (!response.ok) {
      let msg = 'فشل في إنشاء التحضير';
      try {
        const err = await response.json();
        msg = err.error || msg;
      } catch {}
      throw new Error(msg);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = JSON.parse(line.slice(6));
        if (data.type === 'delta') {
          fullText += data.text;
        } else if (data.type === 'error') {
          throw new Error(data.error);
        }
      }
    }

    return { text: fullText, success: true };
  }
}
