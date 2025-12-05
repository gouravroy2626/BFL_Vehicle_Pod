import { Tracker } from './../../../../shared/components/tracker/tracker';
import { Component, ViewEncapsulation, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { debounceTime, switchMap } from 'rxjs/operators';
import { of, BehaviorSubject, Subscription } from 'rxjs';
import { Modal } from 'bootstrap';
import { ExitNudgeService } from './../../../../shared/service/exit-nudge.service';
import { ApiService } from './../../../../shared/service/Api-service';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, NgIf, NgForOf],
  templateUrl: './vehicle-form.html',
  styleUrls: ['./vehicle-form.css'],
  encapsulation: ViewEncapsulation.None,
})
export class VehicleForm implements OnInit, OnDestroy {
  private dealerModalWasOpened = false;
  private dealerModalEverOpened = false; // Tracks if modal was ever opened
  private dealerModalOpenedAt: number | null = null;
  onBrandInput(event: Event) {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.currentBrandQuery = value;
    // Always show all brands if input is empty or whitespace
    if (!value || value.trim().length === 0) {
      this.filteredBrands = [
        'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'BMW', 'Audi',
        'Mercedes-Benz', 'Volkswagen', 'Maruti', 'Tata', 'Mahindra', 'Kia', 'Skoda',
        'Tesla', 'Jaguar', 'Range Rover', 'Porsche', 'Lexus', 'Volvo', 'Mazda'
      ];
      // Reset dealer and model when brand is cleared
      this.form.get('dealer')?.setValue('');
      this.selectedDealer = null;
      // If user has ever interacted with dealer modal, mark as touched
      if (this.dealerModalEverOpened) {
        this.form.get('dealer')?.markAsTouched();
        this.form.get('dealer')?.updateValueAndValidity();
      }
      this.form.get('model')?.setValue('');
      this.filteredModels = this.allModels.slice();
      this.modelFieldFocused = false;
    } else {
      // Filter from full brand list
      const allBrands = [
        'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'BMW', 'Audi',
        'Mercedes-Benz', 'Volkswagen', 'Maruti', 'Tata', 'Mahindra', 'Kia', 'Skoda',
        'Tesla', 'Jaguar', 'Range Rover', 'Porsche', 'Lexus', 'Volvo', 'Mazda'
      ];
      this.filteredBrands = allBrands.filter((b: string) => b.toLowerCase().includes(value.toLowerCase()));
    }
    this.brandFieldFocused = true;
    this.brandHighlightIndex = -1;
  }

  onModelInput(event: Event) {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.currentModelQuery = value;
    // Always show all models if input is empty or whitespace
    if (!value || value.trim().length === 0) {
      this.filteredModels = this.allModels.slice();
      // Reset dealer when model is cleared
      this.form.get('dealer')?.setValue('');
      this.selectedDealer = null;
      // If user has ever interacted with dealer modal, mark as touched
      if (this.dealerModalEverOpened) {
        this.form.get('dealer')?.markAsTouched();
        this.form.get('dealer')?.updateValueAndValidity();
      }
      this.modelFieldFocused = true;
    } else {
      // Filter from allModels, not filteredModels
      this.filteredModels = this.allModels.filter((m: string) => m.toLowerCase().includes(value.toLowerCase()));
      this.modelFieldFocused = true;
    }
    this.modelHighlightIndex = -1;
  }
  openBrandDrawer() {
    this.showBrandDrawer = true;
  }

  openModelDrawer() {
    this.showModelDrawer = true;
  }
  // Drawer state
  showBrandDrawer = false;
  showModelDrawer = false;
  // AEM URL (single endpoint for all vehicle details)
  private readonly vehicleDetailsUrl = 'https://stage-aem-api.bajajfinserv.in/content/bajajfinserv/oneweb-api/in/en/forms/new-car-finance/v1/vehicle-details';
  private subscriptions: Subscription[] = [];
  // CMS data holders
  vehicleDetails: any;
  fieldMap: { [key: string]: any } = {};

  constructor(private apiService: ApiService) { }
  // Save-to-cart is handled by the shared component; forms should only trigger it.
  dealerHighlightIndex = 0;
  @ViewChild('dealerList') dealerList?: ElementRef<HTMLUListElement>;
  private dealerModalElement?: ElementRef<HTMLDivElement>;
  @ViewChild('dealerModal') set dealerModal(element: ElementRef<HTMLDivElement> | undefined) {
    if (this.dealerModalElement === element) {
      return;
    }

    this.teardownDealerModalListeners();
    this.dealerModalElement = element;
    this.setupDealerModalListeners();
  }
  private readonly dealerModalShownHandler = () => this.handleDealerModalShown();
  private readonly dealerModalHiddenHandler = () => this.handleDealerModalHidden();
  onDealerListKeydown(event: KeyboardEvent) {
    if (!this.filteredDealers?.length) return;

    const lastIndex = this.filteredDealers.length - 1;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = this.dealerHighlightIndex < 0 ? 0 : Math.min(this.dealerHighlightIndex + 1, lastIndex);
      this.dealerHighlightIndex = nextIndex;
      this.focusDealerOption(nextIndex);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = this.dealerHighlightIndex <= 0 ? 0 : this.dealerHighlightIndex - 1;
      this.dealerHighlightIndex = prevIndex;
      this.focusDealerOption(prevIndex);
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.dealerHighlightIndex = 0;
      this.focusDealerOption(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      this.dealerHighlightIndex = lastIndex;
      this.focusDealerOption(lastIndex);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = this.getDealerItems()[this.dealerHighlightIndex];
      target?.click();
    }
  }
  highlightAllFilled = false;
  selectingBrand = false;
  selectingModel = false;
  private readonly formBuilder = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly router = inject(Router);
  private readonly exitNudgeService = inject(ExitNudgeService);
  private loaderNavigationTimer: number | null = null;
  readonly form = this.formBuilder.group({
    brand: ['', Validators.required],
    model: ['', Validators.required],
    dealer: ['', Validators.required],
  });

  filteredBrands: string[] = [];
  filteredModels: string[] = [];
  allModels: string[] = [
    'Corolla', 'Civic', 'Accord', 'F-150', 'Mustang', 'Elantra', '3 Series', 'A4',
    'C-Class', 'Golf', 'Swift', 'Nexon', 'XUV500', 'Sonet', 'Superb',
    'Model 3', 'XF', 'Evoque', '911', 'RX', 'XC90', 'CX-5'
  ];
  filteredDealers: string[] = [];
  selectedDealer: string | null = null;
  isLoading = false;
  submittedData = {
    brand: '',
    model: '',
    dealer: ''
  };
  brandFieldFocused = false;
  modelFieldFocused = false;
  brandHighlightIndex = -1;
  modelHighlightIndex = -1;
  currentBrandQuery = '';
  currentModelQuery = '';
  private brandQuery$ = new BehaviorSubject<string>('');
  private modelQuery$ = new BehaviorSubject<string>('');

  ngOnInit() {
    // Show mock data immediately for local development (fallback)
    this.filteredBrands = [
      'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'BMW', 'Audi',
      'Mercedes-Benz', 'Volkswagen', 'Maruti', 'Tata', 'Mahindra', 'Kia', 'Skoda',
      'Tesla', 'Jaguar', 'Range Rover', 'Porsche', 'Lexus', 'Volvo', 'Mazda'
    ];
    this.filteredModels = this.allModels.slice();
    this.filteredDealers = [
      'Premium Motors - Delhi',
      'City Motors - Mumbai',
      'Grand Motors - Bangalore',
      'Elite Auto - Hyderabad',
      'Pride Motors - Chennai',
      'Royal Auto - Pune',
      'Dynamic Motors - Kolkata',
      'Victory Auto - Ahmedabad',
      'Zenith Motors - Jaipur',
      'Star Motors - Lucknow'
    ];
    // Call AEM API to update with real data if available
    this.fetchVehicleDetailsAem();
    // Highlight all fields when filled
    this.form.valueChanges.subscribe(values => {
      if (values.brand && values.model && values.dealer) {
        if (!this.highlightAllFilled) {
          this.highlightAllFilled = true;
          this.cdr.detectChanges();
          setTimeout(() => {
            this.highlightAllFilled = false;
            this.cdr.detectChanges();
          }, 3000);
        }
      }
    });
        // No longer mark dealer as touched on valueChanges; only on submit or explicit user interaction
  }

  fetchVehicleDetailsAem() {
    const sub = this.apiService.getData(this.vehicleDetailsUrl).subscribe({
      next: (data) => {
        this.vehicleDetails = data;
        const screenContent = data?.content?.[0]?.screenContent ?? [];
        // Map all fields by key for easy access
        screenContent.forEach((item: any) => {
          if (item?.key) {
            this.fieldMap[item.key] = item;
          }
        });

        // Extract brands, models, and dealers from screenContent
        // Brands: look for key === 'brand' or title === 'Brand'
        const brandItem = screenContent.find((item: any) => item.key === 'brand' || item.title === 'Brand');
        let brands = [];
        if (brandItem && Array.isArray(brandItem.options)) {
          brands = brandItem.options.map((opt: any) => opt.label).filter((label: string) => !!label);
        }
        // Fallback: try to find all items with key/model/brand
        if (!brands.length) {
          brands = [
            'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'BMW', 'Audi',
            'Mercedes-Benz', 'Volkswagen', 'Maruti', 'Tata', 'Mahindra', 'Kia', 'Skoda',
            'Tesla', 'Jaguar', 'Range Rover', 'Porsche', 'Lexus', 'Volvo', 'Mazda'
          ];
        }
        this.filteredBrands = brands;

        // Models: look for key === 'model' or title === 'Model'
        const modelItem = screenContent.find((item: any) => item.key === 'model' || item.title === 'Model');
        let models = [];
        if (modelItem && Array.isArray(modelItem.options)) {
          models = modelItem.options.map((opt: any) => opt.label).filter((label: string) => !!label);
        }
        if (!models.length) {
          models = this.allModels.slice();
        }
        this.allModels = models.slice();
        this.filteredModels = models.slice();

        // Dealers: use only dealer.options if present, else always use demo list
        let dealers: string[] = [];
        const dealerItem = screenContent.find((item: any) => item.key === 'dealer' || item.title === 'Dealer');
        if (dealerItem && Array.isArray(dealerItem.options)) {
          dealers = dealerItem.options.map((opt: any) => opt.label).filter((label: string) => !!label);
        }
        if (!dealers.length) {
          dealers = [
            'Mahindra Prime - Delhi',
            'Tesla World - Mumbai',
            'Honda Hub - Bangalore',
            'Audi Arena - Hyderabad',
            'BMW Showroom - Chennai',
            'Maruti Center - Pune',
            'Tata Motors - Kolkata',
            'Kia Plaza - Ahmedabad',
            'Skoda Point - Jaipur',
            'Toyota Galaxy - Lucknow'
          ];
        }
        this.filteredDealers = dealers;
      },
      error: (err) => console.error('Vehicle details AEM error', err),
    });
    this.subscriptions.push(sub);
  }
  // Example: fetch dealers from AEM vehicleDetails response
  fetchDealersFromAem() {
    // Try to get dealers from AEM, else use mock data
    const dealers = this.vehicleDetails?.content?.[0]?.dealers ?? [];
    if (dealers.length) {
      this.filteredDealers = dealers.map((d: any) => d?.label).filter((label: string) => !!label);
    } else {
      this.filteredDealers = [
        'Premium Motors - Delhi',
        'City Motors - Mumbai',
        'Grand Motors - Bangalore',
        'Elite Auto - Hyderabad',
        'Pride Motors - Chennai',
        'Royal Auto - Pune',
        'Dynamic Motors - Kolkata',
        'Victory Auto - Ahmedabad',
        'Zenith Motors - Jaipur',
        'Star Motors - Lucknow'
      ];
    }
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    // ...existing cleanup logic if needed
  }

  ngAfterViewInit(): void {
    this.setupDealerModalListeners();
  }

  // Removed duplicate ngOnDestroy implementation

  private setupDealerModalListeners(): void {
    const modalElement = this.dealerModalElement?.nativeElement;
    if (!modalElement) {
      return;
    }

    this.teardownDealerModalListeners();
    modalElement.addEventListener('shown.bs.modal', this.dealerModalShownHandler);
    modalElement.addEventListener('hidden.bs.modal', this.dealerModalHiddenHandler);
  }

  private teardownDealerModalListeners(): void {
    const modalElement = this.dealerModalElement?.nativeElement;
    if (!modalElement) {
      return;
    }

    modalElement.removeEventListener('shown.bs.modal', this.dealerModalShownHandler);
    modalElement.removeEventListener('hidden.bs.modal', this.dealerModalHiddenHandler);
  }

  private cancelLoaderNavigation(): void {
    if (this.loaderNavigationTimer !== null) {
      window.clearTimeout(this.loaderNavigationTimer);
      this.loaderNavigationTimer = null;
    }
  }

  private handleDealerModalShown(): void {
    this.ngZone.run(() => this.onDealerModalShown());
  }

  private handleDealerModalHidden(): void {
    this.ngZone.run(() => this.onDealerModalHidden());
  }

  private onDealerModalShown(): void {
    this.focusDealerList();
  }

  private onDealerModalHidden(): void {
    // Let the router manage scroll behavior; avoid direct manipulation
    if (!this.filteredDealers.length) {
      this.dealerHighlightIndex = -1;
      return;
    }

    if (this.selectedDealer) {
      const selectedIndex = this.filteredDealers.findIndex(dealer => dealer === this.selectedDealer);
      this.dealerHighlightIndex = selectedIndex;
    } else {
      this.dealerHighlightIndex = -1;
    }

    // If modal was opened and is closed and no dealer is selected, mark as touched
    if (this.dealerModalWasOpened) {
      const dealerValue = this.form.get('dealer')?.value;
      const now = Date.now();
      const openDuration = this.dealerModalOpenedAt ? now - this.dealerModalOpenedAt : 0;
      if ((!dealerValue || dealerValue.trim() === '') && openDuration > 300) {
        console.log('Dealer modal closed with no selection, marking as touched');
        this.form.get('dealer')?.markAsTouched();
        this.form.get('dealer')?.updateValueAndValidity();
      } else if (openDuration <= 300) {
        console.log('Dealer modal closed too quickly, not marking as touched');
      } else if (dealerValue && dealerValue.trim() !== '') {
        console.log('Dealer modal closed with selection, not marking as touched');
      }
      this.dealerModalWasOpened = false;
      this.dealerModalOpenedAt = null;
    }
    this.cdr.detectChanges();
  }

  private focusDealerList(): void {
    if (!this.filteredDealers.length) {
      return;
    }

    if (this.dealerHighlightIndex < 0) {
      this.dealerHighlightIndex = this.getDefaultDealerIndex();
    }

    this.cdr.detectChanges();
    window.requestAnimationFrame(() => {
      const listElement = this.dealerList?.nativeElement;
      if (!listElement) {
        return;
      }

      listElement.focus({ preventScroll: true });
      this.focusDealerOption(this.dealerHighlightIndex);
    });
  }

  onBrandFieldFocus() {
    this.brandFieldFocused = true;
    // Show full brand list immediately on focus if input empty
    const current = (this.form.get('brand')?.value ?? '').trim();
    if (!current.length) {
      this.brandHighlightIndex = 0;
    } else {
      this.brandHighlightIndex = -1;
    }
  }

  onBrandFieldBlur() {
    setTimeout(() => {
      if (!this.selectingBrand) {
        this.brandFieldFocused = false;
        this.cdr.detectChanges();
      }
    }, 300); // Increased timeout to ensure focus event completes first
  }

  onModelFieldFocus() {
    this.modelFieldFocused = true;
    const current = (this.form.get('model')?.value ?? '').trim();
    if (!current.length) {
      this.modelHighlightIndex = 0;
    } else {
      this.modelHighlightIndex = -1;
    }
  }

  onModelFieldBlur() {
    setTimeout(() => {
      if (!this.selectingModel) {
        this.modelFieldFocused = false;
        this.cdr.detectChanges();
      }
    }, 200);
  }

  searchBrands(query: string): string[] {
    if (!query || query.trim() === '') return this.filteredBrands.slice();
    const lowerQuery = query.toLowerCase();
    return this.filteredBrands.filter((b: string) => b.toLowerCase().includes(lowerQuery));
  }

  searchModels(query: string): string[] {
    if (!query || query.trim() === '') return this.allModels.slice();
    const lowerQuery = query.toLowerCase();
    return this.allModels.filter((m: string) => m.toLowerCase().includes(lowerQuery));
  }

  onBrandSelect(brand: string) {
    if (!brand) return; // Null check
    this.selectingBrand = true;
    this.form.get('brand')?.setValue(brand);
    this.filteredBrands = [];
    this.brandFieldFocused = false;
    this.brandHighlightIndex = -1;
    this.brandQuery$.next('');
    this.currentBrandQuery = '';
    this.form.get('model')?.setValue('');
    this.filteredModels = this.allModels.slice();
    this.modelFieldFocused = false;
    // Reset dealer when brand is changed
    this.form.get('dealer')?.setValue('');
    this.selectedDealer = null;
    setTimeout(() => {
      this.selectingBrand = false;
      this.cdr.detectChanges();
    }, 200); // Ensure dropdown interaction completes
  }

  onModelSelect(model: string) {
    if (!model) return; // Null check
    this.selectingModel = true;
    this.form.get('model')?.setValue(model);
    // Reset dealer when model is changed
    this.form.get('dealer')?.setValue('');
    this.selectedDealer = null;
    setTimeout(() => {
      this.filteredModels = [];
      this.modelFieldFocused = false;
      this.modelHighlightIndex = -1;
      this.modelQuery$.next('');
      this.currentModelQuery = '';
      this.selectingModel = false;
      this.cdr.detectChanges();
    }, 100);
  }

  onDealerSelect(dealer: string) {
    if (!dealer) {
      this.form.get('dealer')?.setValue('');
      this.selectedDealer = null;
      this.form.get('dealer')?.markAsTouched();
      this.form.get('dealer')?.updateValueAndValidity();
      this.cdr.detectChanges();
      return;
    }
    this.form.get('dealer')?.setValue(dealer);
    this.selectedDealer = dealer;
    // Mark as untouched after selection so error disappears
    this.form.get('dealer')?.markAsUntouched();
    this.form.get('dealer')?.updateValueAndValidity();
    this.cdr.detectChanges();
    const allDealers = this.filteredDealers.slice();
    this.dealerHighlightIndex = allDealers.findIndex((d: string) => d === dealer);
    // Ensure modal closes
    if (this.dealerModalElement) {
      const modal = Modal.getInstance(this.dealerModalElement.nativeElement);
      modal?.hide();
    }
    // Always reset loading state after dealer selection
    this.isLoading = false;
  }

  handleDealerControlTrigger(toggleButton: HTMLButtonElement, event: Event): void {
    event.preventDefault();
    this.dealerModalWasOpened = true;
    this.dealerModalEverOpened = true;
    this.dealerModalOpenedAt = Date.now();
    console.log('Dealer modal opened');
    toggleButton.click();
  }

  onDealerModalButtonClick(): void {
    this.prepareDealerModalFocus();
  }

  onDealerListFocus(): void {
    if (!this.filteredDealers.length) return;
    if (this.dealerHighlightIndex < 0) {
      this.dealerHighlightIndex = 0;
    }
    this.focusDealerOption(this.dealerHighlightIndex);
  }

  private getDefaultDealerIndex(): number {
    // Prefer selected dealer if available
    if (this.selectedDealer) {
      const index = this.filteredDealers.findIndex(dealer => dealer === this.selectedDealer);
      if (index !== -1) {
        return index;
      }
    }
    // Fallback to first dealer
    return 0;
  }

  private focusDealerOption(index: number): void {
    const items = this.getDealerItems();
    if (index < 0 || index >= items.length) {
      return;
    }

    const item = items[index];
    if (item) {
      item.scrollIntoView({ block: 'nearest', inline: 'start' });
      // Delay focus to ensure scroll into view has taken effect
      setTimeout(() => {
        item.focus({ preventScroll: true });
      }, 100);
    }
  }

  private getDealerItems(): HTMLLIElement[] {
    return Array.from(this.dealerList?.nativeElement.querySelectorAll('li') || []);
  }

  // --- BEGIN: HTML template support stubs ---
  get showBrandSearchIcon(): boolean { return false; }
  get brandInputPaddingLeft(): number { return 16; }
  get isBrandFilled(): boolean { return !!this.form.get('brand')?.value; }
  onBrandKeydown(event: KeyboardEvent): void {}
  get showModelSearchIcon(): boolean { return false; }
  get modelInputPaddingLeft(): number { return 16; }
  get isModelFilled(): boolean { return !!this.form.get('model')?.value; }
  onModelKeydown(event: KeyboardEvent): void {}
  get isDealerFilled(): boolean { return !!this.form.get('dealer')?.value; }
  get activeDealerOptionId(): string { return ''; }
  onSaveToCart(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }
    // Call ApiService to save to cart (simulate backend call)
    if (this.apiService && typeof this.apiService.saveToCart === 'function') {
      this.apiService.saveToCart(this.form.value).subscribe({
        next: () => {
          // Optionally reset form or update UI
        },
        error: (err: any) => {
          // Optionally handle error
        }
      });
    }
  }

  onContinue(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }
    // Navigate to next step (e.g., loader or next route)
    this.router.navigate(['/vehicle-details/loader']);
  }
  // --- END: HTML template support stubs ---
    // Stub for missing method to fix error
    prepareDealerModalFocus(): void {
      // TODO: Implement focus logic if needed
    }
}