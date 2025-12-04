import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { ExitNudgeService } from '../../service/exit-nudge.service';

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
  imports: [NgFor],
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
  private readonly slideOrder = ['no-hidden-charges', 'hassle-free-process', 'instant-approvals'];
  private exitSlidesMap = new Map<string, ExitSlide>();

  constructor(
    private router: Router,
    private location: Location,
    private exitNudgeService: ExitNudgeService
  ) { }

  ngOnInit(): void {
    this.currentUrl = this.router.url;
    // initialize carousel items with local fallbacks
    this.carousel = this.buildFallbackSlides();
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl = (event as NavigationEnd).urlAfterRedirects || (event as NavigationEnd).url;
      });

    this.loadExitNudgeContent();
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
    this.showExitFeedback = true;
    this.carouselIndex = 0; // reset to first image each time drawer opens
    // Start auto-scroll after 3 seconds (one cycle then every 3s)
    this.clearCarouselTimers();
      this.carouselStartDelay = setTimeout(() => {
        this.beginCarouselCycle();
    }, 3000);
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
  }

  get currentSlide(): ExitSlide | null {
    if (!this.carousel.length) {
      return null;
    }
    const safeIndex = this.carouselIndex % this.carousel.length;
    return this.carousel[safeIndex];
  }

  private loadExitNudgeContent(): void {
    this.subscriptions.add(
      this.exitNudgeService.getByKey('confirm-exit').subscribe({
        next: (data) => (this.vehicleExitData = data ?? null),
        error: (err) => console.error('Error fetching confirm-exit data', err),
      })
    );

    this.subscriptions.add(
      this.exitNudgeService.getByKey('pick-up-wrapper').subscribe({
        next: (data) => {
          const group = Array.isArray(data?.group) ? data.group : [];
          this.pickupData = group.find((item: any) => item?.key === 'pick-up-where') ?? null;
          this.pickupFeedbackData = group.find((item: any) => item?.key === 'we-are-sorry') ?? null;
          this.pickupCheckboxes = Array.isArray(this.pickupFeedbackData?.['checkbox-group'])
            ? this.pickupFeedbackData['checkbox-group'].map((option: any, idx: number) => ({
                key: option?.['field-item-key'] || `pickup-${idx}`,
                text: option?.['field-item-text'] || option?.['event-prop-value'] || '',
              }))
            : [];
        },
        error: (err) => console.error('Error fetching pick-up-wrapper data', err),
      })
    );

    this.subscriptions.add(
      this.exitNudgeService.getByKey('see-you-go-wrapper').subscribe({
        next: (data) => {
          const group = Array.isArray(data?.group) ? data.group : [];
          this.exitFeedbackFormData = group.find((item: any) => item?.key === 'see-you-go') ?? null;
          this.exitFeedbackCheckboxData = group.find((item: any) => item?.key === 'leave') ?? null;
          this.exitFeedbackCheckboxes = Array.isArray(this.exitFeedbackCheckboxData?.['checkbox-group'])
            ? this.exitFeedbackCheckboxData['checkbox-group'].map((option: any, idx: number) => ({
                key: option?.['field-item-key'] || `feedback-${idx}`,
                text: option?.['field-item-text'] || option?.['event-prop-value'] || '',
              }))
            : [];
        },
        error: (err) => console.error('Error fetching see-you-go-wrapper data', err),
      })
    );

    this.slideOrder.forEach((key) => {
      this.subscriptions.add(
        this.exitNudgeService.getByKey(key).subscribe({
          next: (data) => {
            if (data) {
              this.exitSlidesMap.set(key, {
                src: data['image-android'] || this.getFallbackImage(key),
                title: data.title || this.getFallbackTitle(key),
                description: data.description || this.getFallbackDescription(key),
                stayLabel: data.ctalabel1 || 'STAY AND CONTINUE',
                exitLabel: data.ctalabel2 || 'EXIT ANYWAY',
              });
              this.rebuildSlidesFromMap();
            }
          },
          error: (err) => console.error(`Error fetching exit slide data for ${key}`, err),
        })
      );
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

  private buildFallbackSlides(): ExitSlide[] {
    return [
      {
        src: '/money-bag-percentage.svg',
        title: 'Get your loan today',
        description: 'No hidden charges',
        stayLabel: 'STAY AND CONTINUE',
        exitLabel: 'EXIT ANYWAY',
      },
      {
        src: '/Subtract.svg',
        title: 'Get your loan today',
        description: 'Hassle free process',
        stayLabel: 'STAY AND CONTINUE',
        exitLabel: 'EXIT ANYWAY',
      },
      {
        src: '/Frame 1707481964.svg',
        title: 'Get your loan today',
        description: 'Instant approvals',
        stayLabel: 'STAY AND CONTINUE',
        exitLabel: 'EXIT ANYWAY',
      },
    ];
  }

  private getFallbackImage(key: string): string {
    switch (key) {
      case 'hassle-free-process':
        return '/Subtract.svg';
      case 'instant-approvals':
        return '/Frame 1707481964.svg';
      default:
        return '/money-bag-percentage.svg';
    }
  }

  private getFallbackTitle(_key: string): string {
    return 'Get your loan today';
  }

  private getFallbackDescription(key: string): string {
    switch (key) {
      case 'hassle-free-process':
        return 'Hassle free process';
      case 'instant-approvals':
        return 'Instant approvals';
      default:
        return 'No hidden charges';
    }
  }
}
