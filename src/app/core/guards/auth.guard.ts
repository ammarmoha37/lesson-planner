import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return true;

  // Wait for loading to finish
  if (auth.loading()) {
    return new Promise<boolean>((resolve) => {
      const check = setInterval(() => {
        if (!auth.loading()) {
          clearInterval(check);
          if (auth.isLoggedIn()) {
            resolve(true);
          } else {
            router.navigate(['/login']);
            resolve(false);
          }
        }
      }, 50);
    });
  }

  router.navigate(['/login']);
  return false;
};
