import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../service/Api-service';
import { ExitNudgeService } from '../../../service/exit-nudge.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-save-to-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './save-to-cart.html',
  styleUrls: ['./save-to-cart.css'],
})
export class SaveToCart {
  // AEM + UI state
  subscription: Subscription | null = null;
  exitNudgeSubscription: Subscription | null = null;
  detailsSavedData: any = null;
  formData: any;
  fieldMap: { [key: string]: any } = {};
  private readonly url =
    'https://cms-api.bajajfinserv.in/content/bajajfinserv/oneweb-api/in/en/forms/new-car-finance/v1/personal-details';

  // Responsive behavior
  showSaveCartModal = false;
  showSaveCartDrawer = false;
  private resizeHandler: (() => void) | null = null;
  private openListener: ((e?: Event) => void) | null = null;

  constructor(
    private apiService: ApiService,
    private exitNudgeService: ExitNudgeService,
    private cd: ChangeDetectorRef
  ) {}

  private AemApiCall() {
    this.subscription = this.apiService.getData(this.url).subscribe({
      next: (data) => {
        const screenContent = data?.content?.[0]?.screenContent ?? [];
        this.formData = screenContent;

        screenContent.forEach((item: any) => {
          if (item?.key) {
            this.fieldMap[item.key] = item;
          }
        });
      },
      error: (err) => console.error('Error fetching data', err),
    });
  }

  ngOnInit() {
    this.AemApiCall();
    this.exitNudgeSubscription = this.exitNudgeService
      .getByKey('details-saved-successfully')
      .subscribe({
        next: (data) => (this.detailsSavedData = data ?? null),
        error: (err) => console.error('Error fetching exit nudge data', err),
      });

    // Responsive: switch between modal and drawer when viewport crosses 500px
    this.resizeHandler = () => {
      try {
        const w = window.innerWidth || 1024;
        if (this.showSaveCartModal && w <= 500) {
          this.showSaveCartModal = false;
          this.showSaveCartDrawer = true;
          try {
            this.cd.detectChanges();
          } catch (e) {
            /* noop */
          }
        } else if (this.showSaveCartDrawer && w > 500) {
          this.showSaveCartDrawer = false;
          this.showSaveCartModal = true;
          try {
            this.cd.detectChanges();
          } catch (e) {
            /* noop */
          }
        }
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener('resize', this.resizeHandler);

    // Listen for external open requests (e.g., from forms)
    this.openListener = (e?: Event) => {
      try {
        const w = window.innerWidth || 1024;
        if (w <= 500) {
          this.showSaveCartModal = false;
          this.showSaveCartDrawer = true;
        } else {
          this.showSaveCartDrawer = false;
          this.showSaveCartModal = true;
        }
        try { this.cd.detectChanges(); } catch (e) { /* noop */ }
      } catch (err) {
        // ignore
      }
    };
    window.addEventListener('open-save-cart', this.openListener as EventListener);
  }

  ngOnDestroy() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    if (this.exitNudgeSubscription) {
      this.exitNudgeSubscription.unsubscribe();
      this.exitNudgeSubscription = null;
    }
    if (this.openListener) {
      window.removeEventListener('open-save-cart', this.openListener as EventListener);
      this.openListener = null;
    }
  }

  closeSaveCartModal() {
    this.showSaveCartModal = false;
    this.showSaveCartDrawer = false;
  }

  closeSaveCartDrawer() {
    this.showSaveCartDrawer = false;
  }

}
