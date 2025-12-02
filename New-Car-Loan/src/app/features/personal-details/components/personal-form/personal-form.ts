import { Component, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DrawerComponent } from '../../../../shared/components/drawer/drawer';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../shared/service/Api-service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-personal-form',
  standalone: true,
  imports: [CommonModule, DrawerComponent, FormsModule],
  templateUrl: './personal-form.html',
  styleUrl: './personal-form.css',
})
export class PersonalForm implements OnDestroy {
  // Drawer state and UI flags
  isDrawerOpen = true;
  isGstinDrawerOpen = false;
  isPanDrawerOpen = false;
  // Debug log for initial state
  constructor(
    private router: Router,
    private cd: ChangeDetectorRef,
    private apiService: ApiService
  ) {
    console.log('PersonalForm constructor: isDrawerOpen', this.isDrawerOpen);
  }
  // resize handler reference so we can remove listener on destroy
  private resizeHandler: (() => void) | null = null;
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
  // Formatted display value for salary (includes commas). monthlySalary stores raw digits.
  monthlySalaryDisplay: string = '';
  // Keep previous raw dob digits to help with caret/flow logic
  private _prevDobRaw: string = '';
  employmentModalOpen = false; // controls bootstrap-style modal
  city: string = ''; // Add city property to bind in the template
  gstin: string = '';
  // Consents
  tncAccepted = false;
  creditConsent = false;
  marketingOptIn = false; // optional

  // CMS data holders
  formData: any;
  fieldMap: { [key: string]: any } = {};
  private subscription: Subscription | null = null;
  private readonly url =
    'https://cms-api.bajajfinserv.in/content/bajajfinserv/oneweb-api/in/en/forms/new-car-finance/v1/personal-details';

    private AemApiCall(){
      this.subscription = this.apiService.getData(this.url).subscribe({
      next: (data) => {
        const screenContent = data?.content?.[0]?.screenContent ?? [];
        this.formData = screenContent;

        screenContent.forEach((item: any) => {
          if (item?.key) {
            this.fieldMap[item.key] = item;
          }
        });
      },
      error: (err) => console.error('Error fetching data', err)
    });
    }
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
    this.AemApiCall();
    // Listen for save to cart drawer trigger from vehicle-form
    this.isDrawerOpen = true;
    console.log('PersonalForm ngOnInit: isDrawerOpen set to', this.isDrawerOpen);
    // listen for viewport size changes to keep save-cart overlay visible when crossing the 500px breakpoint
    this.resizeHandler = () => {
      try {
        const w = window.innerWidth || 1024;
        // If a desktop modal is open and viewport shrinks to mobile, switch to mobile drawer
        if (this.showSaveCartModal && w <= 500) {
          this.showSaveCartModal = false;
          this.showSaveCartDrawer = true;
          try { this.cd.detectChanges(); } catch (e) { /* noop */ }
        }
        // If mobile drawer is open and viewport grows beyond mobile, switch to desktop modal
        else if (this.showSaveCartDrawer && w > 500) {
          this.showSaveCartDrawer = false;
          this.showSaveCartModal = true;
          try { this.cd.detectChanges(); } catch (e) { /* noop */ }
        }
      } catch (e) {
        // ignore
      }
    };
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy() {
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
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

  getEmploymentLabel(type: string): string {
    const options = this.fieldMap['employment-type-wrapper']?.group?.[1]?.['dropdown-text-box'];
    if (Array.isArray(options)) {
      const match = options.find((opt: any) => {
        const value = (opt?.['dropdown-values'] || opt?.['event-prop-value'] || '').toLowerCase();
        if (!value) return false;
        if (type === 'self-employed') {
          return value.includes('self');
        }
        if (type === 'salaried') {
          return value.includes('salar');
        }
        return false;
      });
      if (match) {
        return match['dropdown-values'] || match['event-prop-value'] || type;
      }
    }
    return '';
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
    // if (this.employmentType === 'self-employed' && !this.isGstValid()) return true;
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
  const rawDigits = input.value.replace(/\D/g, ''); // keep only numbers

  // Limit to 8 digits (ddmmyyyy)
  const digits = rawDigits.slice(0, 8);

  // Build formatted string with slashes at fixed positions
  let formatted = '';
  if (digits.length > 0) {
    formatted += digits.substring(0, 2); // day
  }
  if (digits.length > 2) {
    formatted += '/' + digits.substring(2, 4); // month
  }
  if (digits.length > 4) {
    formatted += '/' + digits.substring(4); // year
  }

  input.value = formatted;
  this.dob = formatted;

  // Keep caret position stable
  try {
    const caretPos = input.selectionStart || formatted.length;
    input.setSelectionRange(caretPos, caretPos);
  } catch { }
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
    // Preserve caret while formatting with thousands separators
    const selectionStart = input.selectionStart || 0;
    const digitsBefore = (input.value.slice(0, selectionStart).match(/\d/g) || []).length;

    let raw = input.value.replace(/[^0-9]/g, '');
    if (raw.length > 6) raw = raw.slice(0, 6); // arbitrary max length

    // Format with commas
    const formatWithCommas = (s: string) => {
      if (!s) return '';
      // remove leading zeros for display but keep single 0 if value is 0
      s = s.replace(/^0+(?=\d)/, '');
      return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const formatted = formatWithCommas(raw);

    // update model: monthlySalary holds raw digits, display holds formatted
    this.monthlySalary = raw;
    this.monthlySalaryDisplay = formatted;

    input.value = formatted;

    // restore caret after same number of digits
    const computePosFromDigits = (str: string, digitsBeforeCount: number) => {
      if (digitsBeforeCount <= 0) return 0;
      let seen = 0;
      for (let i = 0; i < str.length; i++) {
        if (/\d/.test(str[i])) seen++;
        if (seen === digitsBeforeCount) return i + 1;
      }
      return str.length;
    };

    const newPos = computePosFromDigits(formatted, digitsBefore);
    try { input.setSelectionRange(newPos, newPos); } catch (e) { /* noop */ }
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
    // Debug log to confirm click handler runs and validation state
    console.log('saveToCart called. hasErrors=', this.hasAnyErrors(), 'tncAccepted=', this.tncAccepted, 'creditConsent=', this.creditConsent);
    // Allow saving drafts even if there are validation errors so the user can
    // pick up later from Cart — do not early-return here.
    // if (this.hasAnyErrors()) return;
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
    // don't open overlay if there are validation errors visible on screen
    if (this.hasAnyErrors()) {
      console.log('saveToCart aborted: validation errors present');
      return;
    }

    // Unified: always open the responsive drawer markup; CSS handles desktop vs mobile presentation
    this.showSaveCartDrawer = true;
    this.showSaveCartModal = false;
    try { this.cd.detectChanges(); } catch (e) { /* noop */ }
  }

  // Save-to-cart overlay flags
  showSaveCartModal = false;
  showSaveCartDrawer = false;

  closeSaveCartModal() {
    // Close unified drawer when modal flag used
    this.showSaveCartModal = false;
    this.showSaveCartDrawer = false;
  }

  closeSaveCartDrawer() {
    this.showSaveCartDrawer = false;
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

  // ---- Typing highlight support ----
  private typingTimers: Map<HTMLInputElement, any> = new Map();

  setTyping(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input) return;
    input.classList.add('typing');
    // Clear previous timer
    const prev = this.typingTimers.get(input);
    if (prev) {
      clearTimeout(prev);
    }
    // Remove after idle (no typing) for 400ms
    const timer = setTimeout(() => {
      input.classList.remove('typing');
      this.typingTimers.delete(input);
    }, 400);
    this.typingTimers.set(input, timer);
  }

  onBlurRemoveTyping(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input) return;
    input.classList.remove('typing');
    const t = this.typingTimers.get(input);
    if (t) {
      clearTimeout(t);
      this.typingTimers.delete(input);
    }
  }
}
