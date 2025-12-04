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
  // AEM URLs
  private readonly vehicleDetailsUrl = 'https://cms-api.bajajfinserv.in/content/bajajfinserv/oneweb-api/in/en/forms/new-car-finance/v1/vehicle-details';
  private readonly brandListUrl = 'https://cms-api.bajajfinserv.in/content/bajajfinserv/oneweb-api/in/en/forms/new-car-finance/v1/brand-list';
  private readonly modelListUrl = 'https://cms-api.bajajfinserv.in/content/bajajfinserv/oneweb-api/in/en/forms/new-car-finance/v1/model-list';
  private subscriptions: Subscription[] = [];
  // CMS data holders
  vehicleDetails: any;
  brandList: any;
  modelList: any;
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
    // Show mock data immediately for local development
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
    // Then call AEM APIs to update with real data if available
    this.fetchVehicleDetailsAem();
    this.fetchBrandListAem();
    this.fetchModelListAem();
    // ...existing initialization logic (form, observables, etc.)
  }

  fetchVehicleDetailsAem() {
    const sub = this.apiService.getData(this.vehicleDetailsUrl).subscribe({
      next: (data) => {
        this.vehicleDetails = data;
        const screenContent = data?.content?.[0]?.screenContent ?? [];
        screenContent.forEach((item: any) => {
          if (item?.key) {
            this.fieldMap[item.key] = item;
          }
        });
      },
      error: (err) => console.error('Vehicle details AEM error', err),
    });
    this.subscriptions.push(sub);
  }

  fetchBrandListAem() {
    const sub = this.apiService.getData(this.brandListUrl).subscribe({
      next: (data) => {
        this.brandList = data;
        const brandContent = data?.content?.[0]?.screenContent ?? [];
        brandContent.forEach((item: any) => {
          if (item?.key) {
            this.fieldMap[item.key] = item;
          }
        });
        let brands = brandContent.map((item: any) => item?.label).filter((label: string) => !!label);
        if (!brands.length) {
          brands = [
            'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'BMW', 'Audi',
            'Mercedes-Benz', 'Volkswagen', 'Maruti', 'Tata', 'Mahindra', 'Kia', 'Skoda',
            'Tesla', 'Jaguar', 'Range Rover', 'Porsche', 'Lexus', 'Volvo', 'Mazda'
          ];
        }
        this.filteredBrands = brands;
      },
      error: (err) => {
        console.error('Brand list AEM error', err);
        this.filteredBrands = [
          'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'BMW', 'Audi',
          'Mercedes-Benz', 'Volkswagen', 'Maruti', 'Tata', 'Mahindra', 'Kia', 'Skoda',
          'Tesla', 'Jaguar', 'Range Rover', 'Porsche', 'Lexus', 'Volvo', 'Mazda'
        ];
      },
    });
    this.subscriptions.push(sub);
  }

  fetchModelListAem() {
    const sub = this.apiService.getData(this.modelListUrl).subscribe({
      next: (data) => {
        this.modelList = data;
        const modelContent = data?.content?.[0]?.screenContent ?? [];
        modelContent.forEach((item: any) => {
          if (item?.key) {
            this.fieldMap[item.key] = item;
          }
        });
        let models = modelContent.map((item: any) => item?.label).filter((label: string) => !!label);
        if (!models.length) {
          models = this.allModels.slice();
        }
        this.allModels = models.slice();
        this.filteredModels = models.slice();
      },
      error: (err) => {
        console.error('Model list AEM error', err);
        this.filteredModels = this.allModels.slice();
      },
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
    if (!dealer) return;
    this.form.get('dealer')?.setValue(dealer);
    this.selectedDealer = dealer;
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
    toggleButton.click();
  }

  onDealerModalButtonClick(): void {
    this.prepareDealerModalFocus();
  }

  onDealerListFocus(): void {
    if (!this.filteredDealers.length) return;
    if (this.dealerHighlightIndex < 0) {
      this.dealerHighlightIndex = this.getDefaultDealerIndex();
    }
    this.focusDealerOption(this.dealerHighlightIndex);
  }

  private prepareDealerModalFocus(): void {
    if (!this.filteredDealers.length) {
      this.dealerHighlightIndex = -1;
      return;
    }

    this.dealerHighlightIndex = this.getDefaultDealerIndex();
    this.cdr.detectChanges();
  }

  private getDefaultDealerIndex(): number {
    if (!this.filteredDealers.length) return -1;
    const selectedIndex = this.selectedDealer ? this.filteredDealers.findIndex(d => d === this.selectedDealer) : -1;
    return selectedIndex >= 0 ? selectedIndex : 0;
  }

  private focusDealerOption(index: number): void {
    const items = this.getDealerItems();
    if (!items.length) return;

    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    const target = items[clampedIndex];
    window.requestAnimationFrame(() => {
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'nearest' });
    });
  }

  private getDealerItems(): HTMLLIElement[] {
    const list = this.dealerList?.nativeElement;
    if (!list) return [];
    // Get first 3 li directly under ul
    const firstThree = Array.from(list.querySelectorAll<HTMLLIElement>(":scope > .dealer-list-item"));
    // Get any li inside the scrollable div (for >3 dealers)
    const scrollableDiv = list.querySelector('div');
    const rest = scrollableDiv ? Array.from(scrollableDiv.querySelectorAll<HTMLLIElement>('.dealer-list-item')) : [];
    return [...firstThree, ...rest];
  }

  get activeDealerOptionId(): string | null {
    if (!this.filteredDealers.length || this.dealerHighlightIndex < 0) {
      return null;
    }
    return `dealer-option-${this.dealerHighlightIndex}`;
  }

  onDealerSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value ?? '';
    this.filteredDealers = this.searchDealers(value);
    // ensure change detection updates the modal list
    this.cdr.detectChanges();
  }

  searchDealers(query: string): string[] {
    if (!query || query.trim() === '') return this.filteredDealers.slice();
    const q = query.toLowerCase();
    return this.filteredDealers.filter((d: string) => d.toLowerCase().includes(q));
  }

  onBrandKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!this.filteredBrands.length) return;
      event.preventDefault();
      if (event.key === 'ArrowDown') {
        this.brandHighlightIndex = (this.brandHighlightIndex + 1) % this.filteredBrands.length;
      } else if (event.key === 'ArrowUp') {
        this.brandHighlightIndex = (this.brandHighlightIndex - 1 + this.filteredBrands.length) % this.filteredBrands.length;
      }
      this.scrollToHighlightedItem('brand');
    } else if (event.key === 'Enter' && this.brandHighlightIndex >= 0) {
      this.onBrandSelect(this.filteredBrands[this.brandHighlightIndex]);
    }
  }

  onModelKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!this.filteredModels.length) return;
      event.preventDefault();
      if (event.key === 'ArrowDown') {
        this.modelHighlightIndex = (this.modelHighlightIndex + 1) % this.filteredModels.length;
      } else if (event.key === 'ArrowUp') {
        this.modelHighlightIndex = (this.modelHighlightIndex - 1 + this.filteredModels.length) % this.filteredModels.length;
      }
      this.scrollToHighlightedItem('model');
    } else if (event.key === 'Enter' && this.modelHighlightIndex >= 0) {
      this.onModelSelect(this.filteredModels[this.modelHighlightIndex]);
    }
  }

  private scrollToHighlightedItem(field: 'brand' | 'model'): void {
    const listElement = document.querySelector(`.${field}-autocomplete-list`);
    if (!listElement) return;
    const items = listElement.querySelectorAll('li');
    const idx = this[`${field}HighlightIndex`];
    if (items && items[idx]) {
      items[idx].scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  onContinue() {
    if (this.form.invalid) {
      this.cancelLoaderNavigation();
      this.isLoading = false;
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    const { brand, model, dealer } = this.form.getRawValue();
    this.submittedData = {
      brand: brand ?? '',
      model: model ?? '',
      dealer: dealer ?? this.selectedDealer ?? ''
    };

    this.isLoading = true;
    this.cancelLoaderNavigation();
    this.ngZone.run(() => {
      this.router.navigate(['/vehicle-loader'], {
        state: this.submittedData
      }).then(success => {
        if (!success) {
          this.isLoading = false;
        }
      }).catch(err => {
        this.isLoading = false;
      });
    });
  }

  onSaveToCart() {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
    } else {
      // Trigger the shared SaveToCart component via global event
      try { window.dispatchEvent(new Event('open-save-cart')); } catch (e) { /* noop */ }
    }
    // Remove error highlight on input
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.valueChanges.subscribe(() => {
        this.form.get(key)?.markAsUntouched();
      });
    });
  }

  get showBrandSearchIcon(): boolean {
    const value = (this.form.get('brand')?.value ?? '').trim();
    return value.length === 0;
  }

  get showModelSearchIcon(): boolean {
    const value = (this.form.get('model')?.value ?? '').trim();
    return value.length === 0;
  }

  get brandInputPaddingLeft(): number {
    return this.showBrandSearchIcon ? 44 : 16;
  }

  get modelInputPaddingLeft(): number {
    return this.showModelSearchIcon ? 44 : 16;
  }

  get isBrandFilled(): boolean {
    const value = (this.form.get('brand')?.value ?? '').trim();
    if (!value.length) return false;
    const lowerValue = value.toLowerCase();
    return this.filteredBrands.some((brand: string) => brand.toLowerCase() === lowerValue);
  }

  get isModelFilled(): boolean {
    const value = (this.form.get('model')?.value ?? '').trim();
    if (!value.length) return false;
    const lowerValue = value.toLowerCase();
    return this.filteredModels.some((model: string) => model.toLowerCase() === lowerValue);
  }

  get isDealerFilled(): boolean {
    const value = (this.form.get('dealer')?.value ?? '').trim();
    if (!value.length) return false;
    const lowerValue = value.toLowerCase();
    return this.filteredDealers.some((dealer: string) => dealer.toLowerCase() === lowerValue);
  }

}