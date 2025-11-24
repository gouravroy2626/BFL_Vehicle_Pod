import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, OnInit, OnDestroy, inject, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { NgZone } from '@angular/core';

@Component({
  selector: 'app-vehicle-form-loader',
  standalone: true,
  imports: [],
  templateUrl: './vehicle-form-loader.html',
  styleUrl: './vehicle-form-loader.css',
})
export class VehicleFormLoader implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  brand!: string;
  model!: string;
  dealer!: string;

  constructor() {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { brand: string, model: string, dealer: string };
    if (state) {
      this.brand = state.brand;
      this.model = state.model;
      this.dealer = state.dealer;
    }
  }

  ngOnInit(): void {
    this.renderer.addClass(this.document.documentElement, 'no-scroll');
    this.renderer.addClass(this.document.body, 'no-scroll');
    setTimeout(() => {
      this.ngZone.run(() => {
        this.router.navigate(['/account-aggregator'], {
          state: {
            brand: this.brand,
            model: this.model,
            dealer: this.dealer
          }
        });
      });
    }, 3000); // 3-second delay
  }

  ngOnDestroy(): void {
    // The AccountAggregator will now be responsible for removing the no-scroll class.
    // this.renderer.removeClass(this.document.documentElement, 'no-scroll');
    // this.renderer.removeClass(this.document.body, 'no-scroll');
  }
}