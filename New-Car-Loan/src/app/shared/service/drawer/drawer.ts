// drawer.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './drawer.html',
  styleUrls: ['./drawer.css']
})
export class DrawerComponent {
  @Input() isOpen = true;
  @Input() selectedOption: string = '';
  @Input() showError: boolean = false;
  @Input() isContentVisible: boolean = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() continue = new EventEmitter<{option: string, fullName?: string}>();
  @Output() toggleContent = new EventEmitter<void>();
  @Output() optionChange = new EventEmitter<string>();

  fullName: string = '';
  showNameError: boolean = false; // flag when auto selected and name missing on continue
  // Full name should accept alphabets and spaces only; no error messages shown.
  private namePattern: RegExp = /^[A-Za-z ]+$/; // letters + space
   
  onBackdropClick() {
    this.close.emit();
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
  }
}

