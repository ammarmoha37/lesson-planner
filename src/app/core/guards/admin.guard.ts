import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAdmin()) return true;

  if (auth.loading()) {
    return new Promise<boolean>((resolve) => {
      const check = setInterval(() => {
        if (!auth.loading()) {
          clearInterval(check);
          if (auth.isAdmin()) {
            resolve(true);
          } else {
            router.navigate(['/app']);
            resolve(false);
          }
        }
      }, 50);
    });
  }

  router.navigate(['/app']);
  return false;
};
