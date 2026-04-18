import { Component, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { ToastService } from '../shared/services/toast.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <!-- Toast -->
    @if (toast.visible()) {
      <div
        class="fixed top-5 left-1/2 -translate-x-1/2 z-[999] bg-card text-text px-5 py-3 rounded-xl shadow-lg border border-border text-sm font-medium animate-fade-in"
      >
        {{ toast.message() }}
      </div>
    }

    <!-- Header -->
    <header
      class="bg-gradient-to-l from-primary-dark via-primary to-primary-dark relative overflow-hidden"
    >
      <div
        class="absolute inset-0 opacity-[0.03] pointer-events-none"
        style='background-image: url(&apos;data:image/svg+xml,%3Csvg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23fff" fill-opacity="1"%3E%3Cpath d="M0 0h40v40H0zm40 40h40v40H40z"/%3E%3C/g%3E%3C/svg%3E&apos;)'
      ></div>
      <div class="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4 relative">
        <div
          class="w-16 h-16 bg-white/10 border-2 border-white/20 rounded-full flex items-center justify-center text-3xl shrink-0"
        >
          🦅
        </div>
        <div class="flex-1">
          <h1 class="font-display text-2xl font-bold text-white">محضّر الدروس الذكي</h1>
          <p class="text-xs text-white/60 mt-0.5">
            المنهج الوطني العُماني — مرحباً {{ greeting() }}
          </p>
        </div>
        <div class="flex gap-2 items-center mr-auto">
          @if (auth.isAdmin()) {
            <a routerLink="/admin" class="hdr-btn">📊 لوحة التحكم</a>
          }
          <button (click)="auth.signOut()" class="hdr-btn">🚪 خروج</button>
        </div>
      </div>

      <!-- Nav -->
      <nav class="bg-primary-dark/40 border-t border-white/10">
        <div class="max-w-5xl mx-auto px-6 flex gap-1 overflow-x-auto">
          <a
            routerLink="/app"
            routerLinkActive="nav-active"
            [routerLinkActiveOptions]="{ exact: true }"
            class="nav-tab"
            >✏️ تحضير جديد</a
          >
          <a routerLink="/app/history" routerLinkActive="nav-active" class="nav-tab">📂 المحفوظة</a>
          <a routerLink="/app/profile" routerLinkActive="nav-active" class="nav-tab"
            >⚙️ الملف الشخصي</a
          >
          @if (auth.isAdmin()) {
            <a routerLink="/admin" routerLinkActive="nav-active" class="nav-tab">📊 الإدارة</a>
          }
        </div>
      </nav>
    </header>

    <!-- Main -->
    <main class="max-w-5xl mx-auto px-4 py-6">
      <router-outlet />
    </main>
  `,
  styles: [
    `
      @reference "../../styles.scss";
      :host {
        display: block;
      }
      .font-display {
        font-family: 'Cairo', sans-serif;
      }
      .hdr-btn {
        @apply bg-white/10 border border-white/20 text-white/85 px-4 py-1.5 rounded-full text-sm cursor-pointer flex items-center gap-1 transition-colors hover:bg-white/20 no-underline;
      }
      .nav-tab {
        @apply px-5 py-3 text-sm text-white/65 font-medium cursor-pointer hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap no-underline;
      }
      .nav-active {
        @apply text-white bg-white/10 border-b-2 border-white;
      }
      .animate-fade-in {
        animation: fadeIn 0.25s ease-out;
      }
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translate(-50%, -12px);
        }
        to {
          opacity: 1;
          transform: translate(-50%, 0);
        }
      }
    `,
  ],
})
export class MainLayoutComponent {
  greeting = computed(
    () => this.auth.profile()?.name || this.auth.user()?.email?.split('@')[0] || '',
  );

  constructor(
    public auth: AuthService,
    public toast: ToastService,
  ) {}
}
