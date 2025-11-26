import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgFor } from '@angular/common';
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

  constructor(private router: Router) { }

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

  goBack(): void {
    // Open exit/feedback overlay (modal on desktop, bottom sheet on mobile)
    this.showExitFeedback = true;
  }

 

  exitAnyway() {
    // open the feedback form drawer/modal
    this.onBackButton = false;
    this.showExitFeedback = false;
    this.showExitFeedbackForm = true;
  }

  closeExitFeedback() {
    this.showExitFeedback = false;
    this.showExitFeedbackForm = false;
  }

  closeExitFeedbackForm() {
    this.showExitFeedbackForm = false;
  }

  startCarousel() {
    // deprecated - carousel is now user controlled by dots
  }

  stopCarousel() {
    // no-op for user-controlled carousel
  }

  selectCarousel(index: number) {
    if (index >= 0 && index < this.carousel.length) {
      this.carouselIndex = index;
    }
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }
}
