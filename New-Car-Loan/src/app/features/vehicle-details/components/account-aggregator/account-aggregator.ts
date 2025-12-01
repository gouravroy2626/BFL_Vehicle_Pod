import { Component, OnInit, OnDestroy, Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account-aggregator',
  standalone: true,
  imports: [],
  templateUrl: './account-aggregator.html',
  styleUrls: ['./account-aggregator.css'],
})
export class AccountAggregator implements OnInit, OnDestroy {
  constructor(
    private router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) { }

  ngOnInit() {
    // Debug log for route activation
    console.log('AccountAggregator loaded');
    // Check navigation state
    const navState = this.router.getCurrentNavigation()?.extras.state;
    console.log('Navigation state:', navState);
    // Add class to lock body scroll
    this.renderer.addClass(this.document.documentElement, 'no-scroll');
    this.renderer.addClass(this.document.body, 'no-scroll');

    // Navigate to application-submission after 5 seconds
    setTimeout(() => {
      this.router.navigate(['/application-submission']);
    }, 5000);
  }

  ngOnDestroy() {
    // Remove class to restore body scroll
    this.renderer.removeClass(this.document.documentElement, 'no-scroll');
    this.renderer.removeClass(this.document.body, 'no-scroll');
  }
}
