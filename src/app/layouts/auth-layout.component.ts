import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-dark via-primary to-primary-dark p-6"
    >
      <div class="bg-card rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
        <div class="text-5xl mb-3">🦅</div>
        <h1 class="font-display text-2xl font-bold text-primary mb-1">محضّر الدروس الذكي</h1>
        <p class="text-sm text-muted mb-8">المنهج الوطني العُماني — الصف الخامس حتى الثاني عشر</p>
        <router-outlet />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .font-display {
        font-family: 'Cairo', sans-serif;
      }
    `,
  ],
})
export class AuthLayoutComponent {}
