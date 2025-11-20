import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account-aggregator',
  standalone: true,
  imports: [],
  templateUrl: './account-aggregator.html',
  styleUrls: ['./account-aggregator.css'],
})
export class AccountAggregator implements OnInit {
  constructor(private router: Router) { }

  ngOnInit() {
    // Debug log for route activation
    console.log('AccountAggregator loaded');
    // Check navigation state
    const navState = this.router.getCurrentNavigation()?.extras.state;
    console.log('Navigation state:', navState);
    // Remove any black background if present
    document.body.style.background = '#fff';
    document.documentElement.style.background = '#fff';
  }
}
