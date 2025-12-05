import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { ApiService } from '../../../service/Api-service';

@Component({
  selector: 'app-gst-drawer-service',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gst-drawer-service.html',
  styleUrl: './gst-drawer-service.css',
})
export class GstDrawerService implements OnInit, OnDestroy {
  @Output() closed = new EventEmitter<void>();

  isOpen = false;
  formData: any;
  fieldMap: { [key: string]: any } = {};
  gstContent: any;
  private subscription: Subscription | null = null;
  private readonly url =
    'https://cms-api.bajajfinserv.in/content/bajajfinserv/oneweb-api/in/en/forms/new-car-finance/v1/personal-details';

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.AemApiCall();
  }

  open() {
    if (!this.gstContent) {
      this.gstContent = this.extractGstContent() ?? this.gstContent;
    }

    
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
        this.gstContent = this.extractGstContent() ?? this.gstContent;
      },
      error: (err) => console.error('Error fetching GST drawer data', err),
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

  private extractGstContent() {
    const direct = this.fieldMap['gst-bottom-drawer'];
    if (direct) {
      return direct;
    }

    const gstWrapper = this.fieldMap['gst-wrapper'];
    if (Array.isArray(gstWrapper?.group)) {
      const keyed = gstWrapper.group.find((child: any) => child?.key === 'gst-bottom-drawer');
      if (keyed) {
        return keyed;
      }
      if (gstWrapper.group.length > 1) {
        return gstWrapper.group[1];
      }
    }

    return null;
  }

}
