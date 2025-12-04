import { Tracker } from './../../../../shared/components/tracker/tracker';
import { Component, ViewEncapsulation, inject, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { debounceTime, switchMap } from 'rxjs/operators';
import { of, BehaviorSubject } from 'rxjs';
import { Modal } from 'bootstrap';
import { ExitNudgeService } from './../../../../shared/service/exit-nudge.service';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, NgIf, NgForOf],
  templateUrl: './vehicle-form.html',
  styleUrls: ['./vehicle-form.css'],
  encapsulation: ViewEncapsulation.None,
})
export class VehicleForm implements OnInit, AfterViewInit, OnDestroy {
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

  brands = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai', 'BMW', 'Audi',
    'Mercedes-Benz', 'Volkswagen', 'Maruti', 'Tata', 'Mahindra', 'Kia', 'Skoda',
    'Tesla', 'Jaguar', 'Range Rover', 'Porsche', 'Lexus', 'Volvo', 'Mazda'
  ];
  models = [
    'Corolla', 'Civic', 'Accord', 'F-150', 'Mustang', 'Elantra', '3 Series', 'A4',
    'C-Class', 'Golf', 'Swift', 'Nexon', 'XUV500', 'Sonet', 'Superb',
    'Model 3', 'XF', 'Evoque', '911', 'RX', 'XC90', 'CX-5'
  ];
  dealers = [
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
  filteredBrands: string[] = [];
  filteredModels: string[] = [];
  // Dealer UI state
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
    // Save-to-cart content is now fetched by the shared SaveToCart component.
    this.brandQuery$.pipe(
      debounceTime(300),
      switchMap(query => of(this.searchBrands(query)))
    ).subscribe(filtered => {
      this.filteredBrands = filtered;
      if (this.filteredBrands.length) {
        this.brandHighlightIndex = 0;
      } else {
        this.brandHighlightIndex = -1;
      }
      this.cdr.detectChanges();
    });

    this.modelQuery$.pipe(
      debounceTime(300),
      switchMap(query => of(this.searchModels(query)))
    ).subscribe(filtered => {
      this.filteredModels = filtered;
      if (this.filteredModels.length) {
        this.modelHighlightIndex = 0;
      } else {
        this.modelHighlightIndex = -1;
      }
      this.cdr.detectChanges();
    });

    this.form.get('brand')?.valueChanges.subscribe(value => {
      const nextValue = (value ?? '') as string;
      this.currentBrandQuery = nextValue;
      if (this.selectingBrand) {
        this.brandQuery$.next('');
        this.filteredBrands = [];
        this.brandHighlightIndex = -1;
        this.currentBrandQuery = '';
        return;
      }
      this.brandFieldFocused = true;
      this.brandQuery$.next(nextValue);
    });

    this.form.get('model')?.valueChanges.subscribe(value => {
      const nextValue = (value ?? '') as string;
      this.currentModelQuery = nextValue;
      if (this.selectingModel) {
        this.modelQuery$.next('');
        this.filteredModels = [];
        this.modelHighlightIndex = -1;
        this.currentModelQuery = '';
        return;
      }
      this.modelFieldFocused = true;
      this.modelQuery$.next(nextValue);
    });

    this.form.statusChanges.subscribe(status => {
      if (status === 'VALID') {
        this.highlightAllFilled = true;
        setTimeout(() => this.highlightAllFilled = false, 3000);
      }
    });

    // Initialize dealer list for modal
    this.filteredDealers = this.dealers.slice();
  }

  ngAfterViewInit(): void {
    this.setupDealerModalListeners();
  }

  ngOnDestroy(): void {
    this.teardownDealerModalListeners();
    this.dealerModalElement = undefined;
    this.cancelLoaderNavigation();
  }

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
      this.filteredBrands = this.brands.slice();
      this.brandHighlightIndex = 0;
    } else {
      this.brandHighlightIndex = -1;
    }
  }

  onBrandFieldBlur() {
    setTimeout(() => {
      if (!this.selectingBrand) {
        this.brandFieldFocused = false;
      }
    }, 300); // Increased timeout to ensure focus event completes first
  }

  onModelFieldFocus() {
    this.modelFieldFocused = true;
    const current = (this.form.get('model')?.value ?? '').trim();
    if (!current.length) {
      this.filteredModels = this.models.slice();
      this.modelHighlightIndex = 0;
    } else {
      this.modelHighlightIndex = -1;
    }
  }

  onModelFieldBlur() {
    setTimeout(() => {
      if (!this.selectingModel) {
        this.modelFieldFocused = false;
      }
    }, 200);
  }

  searchBrands(query: string): string[] {
    if (!query || query.trim() === '') return this.brands.slice();
    const lowerQuery = query.toLowerCase();
    return this.brands.filter(b => b.toLowerCase().includes(lowerQuery));
  }

  searchModels(query: string): string[] {
    if (!query || query.trim() === '') return this.models.slice();
    const lowerQuery = query.toLowerCase();
    return this.models.filter(m => m.toLowerCase().includes(lowerQuery));
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
    this.filteredModels = [];
    this.modelFieldFocused = false;
    setTimeout(() => {
      this.selectingBrand = false;
    }, 200); // Ensure dropdown interaction completes
  }

  onModelSelect(model: string) {
    if (!model) return; // Null check
    this.selectingModel = true;
    this.form.get('model')?.setValue(model);
    setTimeout(() => {
      this.filteredModels = [];
      this.modelFieldFocused = false;
      this.modelHighlightIndex = -1;
      this.modelQuery$.next('');
      this.currentModelQuery = '';
      this.selectingModel = false;
    }, 100);
  }

  onDealerSelect(dealer: string) {
    if (!dealer) return;
    this.form.get('dealer')?.setValue(dealer);
    this.selectedDealer = dealer;
    const allDealers = this.dealers.slice();
    this.filteredDealers = allDealers;
    this.dealerHighlightIndex = allDealers.findIndex(d => d === dealer);
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
    if (!query || query.trim() === '') return this.dealers.slice();
    const q = query.toLowerCase();
    return this.dealers.filter(d => d.toLowerCase().includes(q));
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
    const items = listElement?.querySelectorAll('li');
    if (items && items[this[`${field}HighlightIndex`]]) {
      items[this[`${field}HighlightIndex`]].scrollIntoView({ block: 'nearest', inline: 'nearest' });
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
    return this.brands.some(brand => brand.toLowerCase() === lowerValue);
  }

  get isModelFilled(): boolean {
    const value = (this.form.get('model')?.value ?? '').trim();
    if (!value.length) return false;
    const lowerValue = value.toLowerCase();
    return this.models.some(model => model.toLowerCase() === lowerValue);
  }

  get isDealerFilled(): boolean {
    const value = (this.form.get('dealer')?.value ?? '').trim();
    if (!value.length) return false;
    const lowerValue = value.toLowerCase();
    return this.dealers.some(dealer => dealer.toLowerCase() === lowerValue);
  }

}