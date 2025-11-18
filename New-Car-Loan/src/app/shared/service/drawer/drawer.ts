// drawer.component.ts
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  showNameError: boolean = false;
   
  onBackdropClick() {
    this.close.emit();
  }
  
  onCloseClick() {
    this.close.emit();
  }
  
  onContinueClick() {
    // Validate full name if auto-fill is selected
    if (this.selectedOption === 'auto' && !this.fullName.trim()) {
      this.showNameError = true;
      return;
    }
    this.showNameError = false;
    this.continue.emit({
      option: this.selectedOption,
      fullName: this.fullName
    });
  }
  
  onToggleText() {
    this.toggleContent.emit();
  }
  
  onOptionChange(value: string) {
    this.showNameError = false;
    this.fullName = '';
    this.optionChange.emit(value);
  }
}

