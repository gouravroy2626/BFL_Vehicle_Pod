import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DrawerComponent } from '../../../../shared/service/drawer/drawer';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-personal-form',
  standalone: true,
  imports: [CommonModule, DrawerComponent, FormsModule],
  templateUrl: './personal-form.html',
  styleUrl: './personal-form.css',
})
export class PersonalForm {
  // Drawer state and UI flags
  isDrawerOpen = true;
  isGstinDrawerOpen = false;
  isPanDrawerOpen = false;
  // Debug log for initial state
  constructor(private router: Router) {
    console.log('PersonalForm constructor: isDrawerOpen', this.isDrawerOpen);
  }
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
  monthlySalary: string = '';
  employmentModalOpen = false; // controls bootstrap-style modal
  city: string = ''; // Add city property to bind in the template
  gstin: string = '';
  // Consents
  tncAccepted = false;
  creditConsent = false;
  marketingOptIn = false; // optional

  // Error / validation state
  showErrors = false;
  isPincodeValid() {
    const pincode = this.pincode.trim();
    if (/^[0-9]{6}$/.test(pincode)) {
      const city = 'Pune'; // Example city for valid pincode
      localStorage.setItem('city', city);
      this.city = city; // Update city property
      return true;
    }
    this.city = ''; // Clear city if pincode is invalid
    return false;
  }


  // ...existing code...

  vehicleDetails() {
    this.isDrawerOpen = false; // Ensure drawer closes before navigation
    console.log('PersonalForm vehicleDetails: isDrawerOpen set to', this.isDrawerOpen);
    this.router.navigate(['/vehicle-details']);
  }

  // Drawer event handlers
  onDrawerClose() {
    this.isDrawerOpen = false;
    console.log('PersonalForm onDrawerClose: isDrawerOpen set to', this.isDrawerOpen);
  }

  onDrawerOptionChange(option: string) {
    this.selectedOption = option;
    this.showError = false;
    console.log('PersonalForm onDrawerOptionChange: selectedOption set to', this.selectedOption);
  }

  onDrawerToggleContent() {
    this.isContentVisible = !this.isContentVisible;
    console.log('PersonalForm onDrawerToggleContent: isContentVisible set to', this.isContentVisible);
  }

  onDrawerContinue(payload: { option: string; fullName?: string }) {
    console.log('PersonalForm onDrawerContinue: payload', payload);
    if (!payload.option) {
      this.showError = true;
      return;
    }
    this.fullNameFromDrawer = payload.fullName;
    if (payload.fullName) {
      this.fullName = payload.fullName;
    }

    this.isDrawerOpen = false; // close drawer after selection
    console.log('PersonalForm onDrawerContinue: isDrawerOpen set to', this.isDrawerOpen);
    setTimeout(() => {
      this.isDrawerOpen = false;
      console.log('PersonalForm onDrawerContinue (timeout): isDrawerOpen set to', this.isDrawerOpen);
    }, 100);
  }
  // Reset drawer state on navigation (Angular lifecycle)
  ngOnInit() {
    this.isDrawerOpen = true;
    console.log('PersonalForm ngOnInit: isDrawerOpen set to', this.isDrawerOpen);
  }

  // Employment modal controls
  openEmploymentModal() {
    this.employmentModalOpen = true;
    console.log('PersonalForm openEmploymentModal: employmentModalOpen set to', this.employmentModalOpen);
  }

  closeEmploymentModal() {
    this.employmentModalOpen = false;
    console.log('PersonalForm closeEmploymentModal: employmentModalOpen set to', this.employmentModalOpen);
  }

  selectEmploymentType(type: string) {
    this.employmentType = type;
    // Reset salary field when switching type
    if (type !== 'salaried') {
      this.monthlySalary = '';
    }
    if (type === 'salaried') {
      this.gstin = '';
    }
    this.closeEmploymentModal();
  }

  // Validation helpers
  private isRequiredFilled(value: string): boolean {
    return value.trim().length > 0;
  }

  hasAnyErrors(): boolean {
    if (!this.isRequiredFilled(this.fullName)) return true;
    if (!this.gender) return true;
    if (!this.isRequiredFilled(this.dob)) return true;
    if (!this.isAgeValid()) return true;
    if (!this.isPanValid()) return true;
    if (!this.employmentType) return true;
    if (!this.isPincodeValidLocal()) return true;
    if (this.employmentType === 'salaried' && !this.isSalaryValid()) return true;
    if (this.employmentType === 'self-employed' && !this.isGstValid()) return true;
    if (!this.tncAccepted) return true;
    if (!this.creditConsent) return true;
    // mobile not described in new requirements but keep previous rule if provided
    if (this.mobile && this.mobile.length !== 10) return true;
    return false;
  }

  // Validation detail methods
  isPanValid(): boolean {
    const pan = this.pan.trim().toUpperCase();
    // PAN: 10-character alphanumeric, typically 5 letters + 4 digits + 1 letter, but accept generic pattern
    const panRegex = /^[A-Z0-9]{10}$/;
    return panRegex.test(pan);
  }

  isPincodeValidLocal(): boolean {
    return /^[0-9]{6}$/.test(this.pincode.trim());
  }

  isSalaryValid(): boolean {
    if (!this.monthlySalary) return false;
    const value = parseInt(this.monthlySalary, 10);
    if (isNaN(value)) return false;
    return value >= 15000 && value <= 75000;
  }

  isGstValid(): boolean {
    if (!this.gstin) return false;
    // GSTIN: 15-character alphanumeric, only capital letters and numbers
    const gstRegex = /^[A-Z0-9]{15}$/;
    return gstRegex.test(this.gstin);
  }
  isAgeValid(): boolean {
    if (!this.dob) return true; // age error only if DOB filled
    const age = this.calculateAge(this.dob);
    return age >= 18 && age <= 65;
  }

  calculateAge(dateStr: string): number {
    const dobDate = new Date(dateStr);
    if (isNaN(dobDate.getTime())) return 0;
    const diff = Date.now() - dobDate.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }

  onDobInput(e: Event) {
    const input = e.target as HTMLInputElement;
    let raw = input.value.replace(/\D/g, ''); // only digits

    let day = '';
    let month = '';
    let year = '';

    if (raw.length <= 2) {
      day = raw;
    } else if (raw.length <= 4) {
      day = raw.substring(0, 2);
      month = raw.substring(2);
    } else {
      day = raw.substring(0, 2);
      month = raw.substring(2, 4);
      year = raw.substring(4, 8);
    }

    let formatted = day;
    if (month) formatted += '/' + month;
    if (year) formatted += '/' + year;

    input.value = formatted;
    this.dob = formatted;
  }

  // Input handlers to enforce constraints
  onFullNameInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^A-Za-z ]+/g, '');
    if (sanitized !== input.value) input.value = sanitized;
    this.fullName = sanitized;
  }

  onPanInput(e: Event) {
    const input = e.target as HTMLInputElement;
    let val = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 10) val = val.slice(0, 10);
    input.value = val;
    this.pan = val;
  }

  onPincodeInput(e: Event) {
    const input = e.target as HTMLInputElement;
    let val = input.value.replace(/[^0-9]/g, '');
    if (val.length > 6) val = val.slice(0, 6);
    input.value = val;
    this.pincode = val;
  }

  onSalaryInput(e: Event) {
    const input = e.target as HTMLInputElement;
    let val = input.value.replace(/[^0-9]/g, '');
    if (val.length > 6) val = val.slice(0, 6); // arbitrary max length
    input.value = val;
    this.monthlySalary = val;
  }

  onGstInput(e: Event) {
    const input = e.target as HTMLInputElement;
    let val = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 15) val = val.slice(0, 15);
    input.value = val;
    this.gstin = val;
  }

  // Re-evaluate errors when consent toggled so border warning disappears immediately
  onConsentChange() {
    // If both consents fixed, keep showErrors true only if other errors remain
    if (this.showErrors) {
      this.showErrors = this.hasAnyErrors();
    }
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
    // If there are validation errors, prevent navigation and focus the first invalid field
    if (this.hasAnyErrors()) {
      // Try to focus the first invalid input (best-effort)
      setTimeout(() => {
        const firstInvalid = document.querySelector('.field-error, input:invalid, .tnc-error');
        if (firstInvalid instanceof HTMLElement) {
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // If it's an input, focus it
          if ((firstInvalid as HTMLInputElement).focus) {
            try { (firstInvalid as HTMLInputElement).focus(); } catch (e) { /* ignore */ }
          }
        }
      }, 50);
      return;
    }

    this.vehicleDetails();
  }

  
  openDrawerForGstin() {
    this.isGstinDrawerOpen = true;
  }

  openDrawerForPan() {
    this.isPanDrawerOpen = true;
  }

  closeGstinDrawer() {
    this.isGstinDrawerOpen = false;
  }

  closePanDrawer() {
    this.isPanDrawerOpen = false;
  }
}
