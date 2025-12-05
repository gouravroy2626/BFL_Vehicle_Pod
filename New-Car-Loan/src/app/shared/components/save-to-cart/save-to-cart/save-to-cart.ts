import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';

import { ApiService } from '../../../service/Api-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-save-to-cart',
  standalone: true,
  imports: [],
  templateUrl: './save-to-cart.html',
  styleUrls: ['./save-to-cart.css'],
})
export class SaveToCart {
  // AEM + UI state
  subscription: Subscription | null = null;
  detailsSavedData: any = null;
  formData: any;
  fieldMap: { [key: string]: any } = {};
  private readonly url =
    'https://cms-api.bajajfinserv.in/content/bajajfinserv/oneweb-api/in/en/forms/new-car-finance/v1/exit-nudge';

  // Responsive behavior
  showSaveCartModal = false;
  showSaveCartDrawer = false;
  private resizeHandler: (() => void) | null = null;

  constructor(
    private apiService: ApiService,
    private cd: ChangeDetectorRef
  ) {}

  private AemApiCall() {

    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    this.subscription = this.apiService.getData(this.url).subscribe({
      next: (data) => {
        const screenContent = data?.content?.[0]?.screenContent ?? [];
        this.formData = screenContent;
        this.fieldMap = {};
        this.mapContent(screenContent);
        this.detailsSavedData = this.fieldMap['details-saved-successfully'] ?? null;
      },
      error: (err) => console.error('Error fetching data', err),
    });
  }

  ngOnInit() {
    
  }

  ngOnDestroy() {
    
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  closeSaveCartModal() {
    this.showSaveCartModal = false;
    this.showSaveCartDrawer = false;
  }

  closeSaveCartDrawer() {
    this.showSaveCartDrawer = false;
  }

  private ensureContentLoaded() {
    this.AemApiCall();
  }

  private mapContent(items: any[]): void {
    if (!Array.isArray(items)) {
      return;
    }

    items.forEach((item: any) => {
      if (!item || typeof item !== 'object') {
        return;
      }

      const key = item.key ?? item['field-item-key'];
      if (key) {
        this.fieldMap[key] = item;
      }

      if (Array.isArray(item.group)) {
        this.mapContent(item.group);
      }

      if (Array.isArray(item['checkbox-group'])) {
        this.mapContent(item['checkbox-group']);
      }
    });
  }

  open() {
    try {
      this.ensureContentLoaded();
      const w = window.innerWidth
      if (w <= 500) {
        this.showSaveCartModal = false;
        this.showSaveCartDrawer = true;
      } else {
        this.showSaveCartDrawer = false;
        this.showSaveCartModal = true;
      }
      try {
        this.cd.detectChanges();
      } catch (e) {
        
      }
    } catch (err) {
      
    }
  }

}
