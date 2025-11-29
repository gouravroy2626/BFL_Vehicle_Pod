import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DrawerService {
  private cartDrawerSubject = new Subject<void>();
  cartDrawer$ = this.cartDrawerSubject.asObservable();

  openCartDrawer() {
    this.cartDrawerSubject.next();
  }
}
