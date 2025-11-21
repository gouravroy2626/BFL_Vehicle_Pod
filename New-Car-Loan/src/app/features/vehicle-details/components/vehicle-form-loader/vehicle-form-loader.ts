
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgZone } from '@angular/core';

@Component({
  selector: 'app-vehicle-form-loader',
  standalone: true,
  imports: [],
  templateUrl: './vehicle-form-loader.html',
  styleUrl: './vehicle-form-loader.css',
})
export class VehicleFormLoader implements OnInit {
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);

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
}
