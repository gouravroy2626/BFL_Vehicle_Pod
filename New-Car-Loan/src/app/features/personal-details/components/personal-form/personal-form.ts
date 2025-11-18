import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Tracker } from '../../../../shared/components/tracker/tracker';
import { DrawerComponent } from '../../../../shared/service/drawer/drawer';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-personal-form',
  standalone: true,
  imports: [CommonModule, Tracker, DrawerComponent, FormsModule],
  templateUrl: './personal-form.html',
  styleUrl: './personal-form.css',
})
export class PersonalForm {
  // Drawer state and UI flags
  isDrawerOpen = true;
  selectedOption: string = '';
  showError: boolean = false;
  isContentVisible: boolean = false;
  fullNameFromDrawer?: string;
  fullName: string = '';
  gender: string = '';
  mobile: string = '';
  email: string = '';
  address: string = '';
  dob: string = '';
  pan: string = '';
  employmentType: string = '';
  pincode: string = '';

  // Consents
  tncAccepted = false;
  creditConsent = false;
  marketingOptIn = false; // optional

  // Error / validation state
  showErrors = false;
  isPincodeValid() {
    const pincode = localStorage.getItem('pincode');
    if (pincode && pincode.length === 6) {
      const city = 'pune'; // Example city
      localStorage.setItem('city', city);
      return true;
    }
    return false;
  }


  constructor(private router: Router) {}

  vehicleDetails() {
    this.router.navigate(['/vehicle-details']);
  }

  // Drawer event handlers
  onDrawerClose() {
    this.isDrawerOpen = false;
  }

  onDrawerOptionChange(option: string) {
    this.selectedOption = option;
    this.showError = false;
  }

  onDrawerToggleContent() {
    this.isContentVisible = !this.isContentVisible;
  }

  onDrawerContinue(payload: { option: string; fullName?: string }) {
    if (!payload.option) {
      this.showError = true;
      return;
    }
    this.fullNameFromDrawer = payload.fullName;
    if (payload.fullName) {
      this.fullName = payload.fullName;
    }
    this.isDrawerOpen = false; // close drawer after selection
  }

  // Validation helpers
  private isRequiredFilled(value: string): boolean {
    return value.trim().length > 0;
  }

  hasAnyErrors(): boolean {
    return !(
      this.isRequiredFilled(this.fullName) &&
      this.gender &&
      this.isRequiredFilled(this.dob) &&
      this.isRequiredFilled(this.pan) &&
      this.employmentType &&
      this.isRequiredFilled(this.pincode) &&
      this.tncAccepted &&
      this.creditConsent &&
      this.mobile.length === 10
    );
  }

  saveToCart() {
    // Simple validation gate before saving
    this.showErrors = true;
    if (this.hasAnyErrors()) return;
    // Simulate save logic (could integrate service later)
    console.log('Saved draft:', {
      fullName: this.fullName,
      gender: this.gender,
      dob: this.dob,
      pan: this.pan,
      employmentType: this.employmentType,
      pincode: this.pincode,
      mobile: this.mobile,
      email: this.email,
      address: this.address,
      consents: { tncAccepted: this.tncAccepted, creditConsent: this.creditConsent, marketingOptIn: this.marketingOptIn }
    });
  }

  onContinue() {
    this.showErrors = true;
    if (this.hasAnyErrors()) return; // show error summary; prevent navigation
    this.vehicleDetails();
  }
}
