import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ApiService } from '../../service/Api-service';

interface ExitSlide {
  src: string;
  title: string;
  description: string;
  stayLabel: string;
  exitLabel: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})

export class Navbar implements OnInit, OnDestroy {
 onBackButton=false;
  showExitFeedback = false;
  showExitFeedbackForm = false;
  showVehicleExit = false;
  showPickupDrawer = false;
  private currentUrl: string = '';
  // carousel
  carouselIndex = 0;
  carousel: ExitSlide[] = [];
  vehicleExitData: any = null;
  pickupData: any = null;
  pickupFeedbackData: any = null;
  pickupCheckboxes: Array<{ key: string; text: string }> = [];
  exitFeedbackFormData: any = null;
  exitFeedbackCheckboxData: any = null;
  exitFeedbackCheckboxes: Array<{ key: string; text: string }> = [];
  private subscriptions = new Subscription();
  private exitNudgeSubscription: Subscription | null = null;
  private readonly slideOrder = ['no-hidden-charges', 'hassle-free-process', 'instant-approvals'];
  private exitSlidesMap = new Map<string, ExitSlide>();
  private exitNudgeMap: { [key: string]: any } = {};

  constructor(
    private router: Router,
    private location: Location,
    private apiService: ApiService
  ) { }

  private readonly exitNudgeUrl =
    'https://cms-api.bajajfinserv.in/content/bajajfinserv/oneweb-api/in/en/forms/new-car-finance/v1/exit-nudge';
  ngOnInit(): void {
    this.currentUrl = this.router.url;
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl = (event as NavigationEnd).urlAfterRedirects || (event as NavigationEnd).url;
      });

    // this.loadExitNudgeContent();
  }

  showBackButton(): boolean {
    return this.currentUrl !== '/' && this.currentUrl !== '' && this.currentUrl !== '/home';
  }

  showVehicleCartIcon(): boolean {
    return this.currentUrl.startsWith('/vehicle-details');
  }

  // Vehicle details exit drawer handlers
  openVehicleExit(): void {
    if (this.currentUrl.startsWith('/vehicle-details')) {
      this.loadExitNudgeContent();
      this.showVehicleExit = true;
    }
  }

  closeVehicleExit(): void {
    this.showVehicleExit = false;
  }

  yesLeaveVehicle(): void {
    // Close confirm modal and open the new pickup drawer per spec
    this.showVehicleExit = false;
    this.showExitFeedback = false;
    this.showExitFeedbackForm = false;
    this.clearCarouselTimers();
    this.loadExitNudgeContent();
    this.showPickupDrawer = true;
  }

  private carouselTimer: any;
  private carouselStartDelay: any;

  goBack(): void {
    // Only intercept back on personal details page; otherwise navigate back normally
    if (this.currentUrl.startsWith('/personal-details')) {
      this.openExitDrawer();
    } else {
      this.location.back();
    }
  }

  private openExitDrawer() {
    this.loadExitNudgeContent();
    this.showExitFeedback = true;
    this.carouselIndex = 0; 

    this.clearCarouselTimers();
      this.carouselStartDelay = setTimeout(() => {
        this.beginCarouselCycle();
    }, 2000);
  }

  private beginCarouselCycle() {
    this.clearCarouselTimers();
    this.carouselTimer = setInterval(() => {
      this.carouselIndex = (this.carouselIndex + 1) % this.carousel.length;
    }, 3000);
  }

  private clearCarouselTimers() {
    if (this.carouselStartDelay) {
      clearTimeout(this.carouselStartDelay);
      this.carouselStartDelay = null;
    }
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
      this.carouselTimer = null;
    }
  }

 

  exitAnyway() {
    // open the feedback form drawer/modal
    this.onBackButton = false;
    this.showExitFeedback = false;
    this.clearCarouselTimers();
    this.loadExitNudgeContent();
    this.showExitFeedbackForm = true;
  }

  closeExitFeedback() {
    this.showExitFeedback = false;
    this.showExitFeedbackForm = false;
    this.clearCarouselTimers();
  }

  closeExitFeedbackForm() {
    this.showExitFeedbackForm = false;
    // Also close pickup drawer if open
    this.showPickupDrawer = false;
    // After submitting feedback, navigate to personal-details as requested
    if (this.currentUrl !== '/personal-details') {
      this.router.navigateByUrl('/personal-details');
    }
  }

  closePickupDrawer() {
    this.showPickupDrawer = false;
  }

  // Legacy methods kept for compatibility with existing calls (no-op replaced by clear)
  startCarousel() { /* no-op: auto handled */ }
  stopCarousel() { this.clearCarouselTimers(); }

  selectCarousel(index: number) {
    if (this.carousel.length && index >= 0 && index < this.carousel.length) {
      this.carouselIndex = index;
    }
  }

  ngOnDestroy(): void {
    this.stopCarousel();
    this.subscriptions.unsubscribe();
    this.exitNudgeSubscription?.unsubscribe();
  }

  get currentSlide(): ExitSlide | null {
    if (!this.carousel.length) {
      return null;
    }
    const safeIndex = this.carouselIndex % this.carousel.length;
    return this.carousel[safeIndex];
  }

  private loadExitNudgeContent(): void {

    
    this.exitNudgeSubscription = this.apiService.getData(this.exitNudgeUrl).subscribe({
      
      next: (data) => {
        const screenContent = data?.content?.[0]?.screenContent ?? [];
        this.exitNudgeMap = {};
        this.mapContent(screenContent, this.exitNudgeMap);

        this.vehicleExitData = this.exitNudgeMap['confirm-exit'] ?? null;
        this.pickupData = this.exitNudgeMap['pick-up-where'] ?? null;
        this.pickupFeedbackData = this.exitNudgeMap['we-are-sorry'] ?? null;
        const pickupCheckboxGroup = Array.isArray(this.pickupFeedbackData?.['checkbox-group'])
          ? this.pickupFeedbackData['checkbox-group']
          : [];
        this.pickupCheckboxes = pickupCheckboxGroup.map((option: any, idx: number) => ({
          key: option?.['field-item-key'],
          text: option?.['field-item-text'],
        }));

        this.exitFeedbackFormData = this.exitNudgeMap['see-you-go'] ?? null;
        this.exitFeedbackCheckboxData = this.exitNudgeMap['leave'] ?? null;
        const exitCheckboxGroup = Array.isArray(this.exitFeedbackCheckboxData?.['checkbox-group'])
          ? this.exitFeedbackCheckboxData['checkbox-group']
          : [];
        this.exitFeedbackCheckboxes = exitCheckboxGroup.map((option: any, idx: number) => ({
          key: option?.['field-item-key'],
          text: option?.['field-item-text'],
        }));

        this.exitSlidesMap.clear();
        this.slideOrder.forEach((key) => {
          const dataForKey = this.exitNudgeMap[key];
          if (dataForKey) {
            this.exitSlidesMap.set(key, {
              src: dataForKey['image-android'],
              title: dataForKey.title,
              description: dataForKey.description,
              stayLabel: dataForKey.ctalabel1,
              exitLabel: dataForKey.ctalabel2,
            });
          }
        });
        this.rebuildSlidesFromMap();
      },
      error: (err) => console.error('Error fetching exit nudge data', err),
    });
  }

  private rebuildSlidesFromMap(): void {
    const slides: ExitSlide[] = [];
    this.slideOrder.forEach((key) => {
      const slide = this.exitSlidesMap.get(key);
      if (slide) {
        slides.push(slide);
      }
    });
    if (slides.length) {
      this.carousel = slides;
      this.carouselIndex = 0;
    }
  }

  private mapContent(items: any[], target: { [key: string]: any }): void {
    if (!Array.isArray(items)) {
      return;
    }

    items.forEach((item: any) => {
      if (!item || typeof item !== 'object') {
        return;
      }

      const key = item.key ?? item['field-item-key'];
      if (key) {
        target[key] = item;
      }

      if (Array.isArray(item.group)) {
        this.mapContent(item.group, target);
      }

      if (Array.isArray(item['checkbox-group'])) {
        this.mapContent(item['checkbox-group'], target);
      }
    });
  }
  
}
