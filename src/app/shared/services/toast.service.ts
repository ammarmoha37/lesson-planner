import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  message = signal('');
  visible = signal(false);
  private timeout: any;

  show(msg: string, duration = 6000) {
    this.message.set(msg);
    this.visible.set(true);
    clearTimeout(this.timeout);
    this.timeout = setTimeout(() => this.visible.set(false), duration);
  }
}
