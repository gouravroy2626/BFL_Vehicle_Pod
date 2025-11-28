import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor, Location } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [NgFor],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
 onBackButton=false;
  showExitFeedback = false;
  showExitFeedbackForm = false;
  private currentUrl: string = '';
  // carousel
  carouselIndex = 0;
  carousel: Array<{ src: string; caption: string }> = [];

  constructor(private router: Router, private location: Location) { }

  ngOnInit(): void {
    this.currentUrl = this.router.url;
    // initialize carousel items
    this.carousel = [
      { src: '/money-bag-percentage.svg', caption: 'No hidden charges' },
      { src: '/Subtract.svg', caption: 'Hassle free process' },
      { src: '/Frame 1707481964.svg', caption: 'Instant approvals' },
    ];
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl = (event as NavigationEnd).urlAfterRedirects || (event as NavigationEnd).url;
      });
  }

  showBackButton(): boolean {
    return this.currentUrl !== '/' && this.currentUrl !== '' && this.currentUrl !== '/home';
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
  }

  // Legacy methods kept for compatibility with existing calls (no-op replaced by clear)
  startCarousel() { /* no-op: auto handled */ }
  stopCarousel() { this.clearCarouselTimers(); }

  selectCarousel(index: number) {
    if (index >= 0 && index < this.carousel.length) {
      this.carouselIndex = index;
    }
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }
}
