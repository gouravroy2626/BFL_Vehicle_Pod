// drawer.component.ts
import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { ApiService } from '../../service/Api-service';


@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './drawer.html',
  styleUrls: ['./drawer.css']
})
export class DrawerComponent implements OnInit, OnChanges, OnDestroy {
  formData: any;
  screenMap: { [key: string]: any } = {};

  private url = 'https://cms-api.bajajfinserv.in/content/bajajfinserv/oneweb-api/in/en/forms/two-wheeler-finance/v1/experian';

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.AemApiCall();
  }

  private AemApiCall() {
    
    this.apiService.getData(this.url).subscribe({
      next: (data) => {
        const screenContent = data?.content?.[0]?.screenContent ?? [];
        const map: { [key: string]: any } = {};

        screenContent.forEach((item: any) => {
          if (item?.key) {
            map[item.key] = item;
          }
        });
        this.screenMap = map;
        this.formData = this.screenMap['select-an-option'] ?? null;
      },
      error: (err) => console.error('Error fetching data', err)
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen']) {
      console.log('DrawerComponent ngOnChanges: isOpen', changes['isOpen'].currentValue);
      if (changes['isOpen'].currentValue === false) {
        // Reset internal state when drawer closes
        this.showNameError = false;
        this.fullName = '';
        this.selectedOption = '';
        this.isContentVisible = false;
        // remove no-scroll class from body when drawer closes
        try {
          document && document.body && document.body.classList && document.body.classList.remove('no-scroll');
        } catch (e) {
          // noop in environments without document (server-side)
        }
      }
  if (changes['isOpen'].currentValue === true) {
        // add no-scroll to body when drawer opens
        try {
          document && document.body && document.body.classList && document.body.classList.add('no-scroll');
        } catch (e) {
          // noop
        }
      }
    }
  }

  @Input() isOpen = true;
  @Input() selectedOption: string = '';
  @Input() showError: boolean = false;
  @Input() isContentVisible: boolean = false;

  @Output() close = new EventEmitter<void>();
  @Output() continue = new EventEmitter<{ option: string, fullName?: string }>();
  @Output() toggleContent = new EventEmitter<void>();
  @Output() optionChange = new EventEmitter<string>();

  fullName: string = '';
  showNameError: boolean = false; // flag when auto selected and name missing on continue
  // Full name should accept alphabets and spaces only; no error messages shown.
  private namePattern: RegExp = /^[A-Za-z ]+$/; // letters + space

  onBackdropClick() {
    this.close.emit();
  }

  ngOnDestroy() {
    // ensure the body class is cleaned up if the component is destroyed
    try {
      document && document.body && document.body.classList && document.body.classList.remove('no-scroll');
    } catch (e) {
      // noop
    }
  }

  onCloseClick() {
    this.close.emit();
  }

  onContinueClick() {
    if (this.selectedOption === 'auto') {
      const value = this.fullName.trim();
      if (value.length === 0) {
        this.showNameError = true; // trigger visible warning
        return;
      }
    }
    this.showNameError = false;
    this.continue.emit({ option: this.selectedOption, fullName: this.fullName });
  }

  onToggleText() {
    this.toggleContent.emit();
  }

  onOptionChange(value: string) {
    this.fullName = '';
    this.showNameError = false;
    this.optionChange.emit(value);
  }

  onFullNameInput(raw: Event) {
    const target = raw.target as HTMLInputElement;
    // Sanitize to allowed characters only (letters + space)
    const original = target.value;
    const sanitized = original.replace(/[^A-Za-z ]+/g, '');
    if (original !== sanitized) {
      // Update input's visible value without triggering cursor jump (simple assignment OK for short field)
      target.value = sanitized;
    }
    this.fullName = sanitized;
    if (this.showNameError && this.fullName.trim().length > 0) {
      this.showNameError = false; // clear error as user types
    }

    // Add highlight class for 3 seconds
    this.fullNameHighlight = true;
    clearTimeout(this.fullNameHighlightTimeout);
    this.fullNameHighlightTimeout = setTimeout(() => {
      this.fullNameHighlight = false;
    }, 3000);
  }

  fullNameHighlight: boolean = false;
  private fullNameHighlightTimeout: any;
}

