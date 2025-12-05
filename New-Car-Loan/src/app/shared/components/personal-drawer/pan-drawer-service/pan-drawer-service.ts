import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';

import { Subscription } from 'rxjs';
import { ApiService } from '../../../service/Api-service';

@Component({
  selector: 'app-pan-drawer-service',
  standalone: true,
  imports: [],
  templateUrl: './pan-drawer-service.html',
  styleUrl: './pan-drawer-service.css',
})
export class PanDrawerService implements OnInit, OnDestroy {
  @Output() closed = new EventEmitter<void>();

  isOpen = false;
  formData: any;
  fieldMap: { [key: string]: any } = {};
  panContent: any;
  private subscription: Subscription | null = null;
  private readonly url =
    'https://cms-api.bajajfinserv.in/content/bajajfinserv/oneweb-api/in/en/forms/new-car-finance/v1/personal-details';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.AemApiCall();
  }

  private AemApiCall(force: boolean = false) {
    if (this.subscription && force) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }

    if (this.subscription) {
      return;
    }

    this.subscription = this.apiService.getData(this.url).subscribe({
      next: (data) => {
        const screenContent = data?.content?.[0]?.screenContent ?? [];
        this.formData = screenContent;
        this.fieldMap = {};
        this.mapContent(screenContent);
        this.panContent = this.fieldMap['pan-bottom-drawer'] || this.panContent;
      },
      error: (err) => console.error('Error fetching data', err),
    });
  }

  private mapContent(items: any[]) {
    if (!Array.isArray(items)) return;
    items.forEach((item: any) => {
      if (!item || typeof item !== 'object') return;
      if (item.key) {
        this.fieldMap[item.key] = item;
      }
      if (Array.isArray(item.group)) {
        this.mapContent(item.group);
      }
    });
  }

  open() {
    

    
      this.AemApiCall(true);
    

    this.isOpen = true;
  }

  close() {
    this.isOpen = false;
    this.closed.emit();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }
}
