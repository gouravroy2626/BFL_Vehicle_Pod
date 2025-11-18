import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [],
  templateUrl: './tracker.html',
  styleUrl: './tracker.css',
})
export class Tracker implements OnInit {
  steps = ['Personal details', 'Vehicle details', 'Income verification'];
  currentStep = 0;

  private readonly completedIcon = '/Path 3.svg'; // tick
  private readonly activeIcon = '/Ellipse 22.svg'; // dot
  private readonly lockedIcon = '/aaa.svg'; // lock

  constructor(private router: Router) {}

  ngOnInit() {
    this.updateCurrentStep();
  }

  updateCurrentStep() {
    const url = this.router.url;
    if (url.includes('personal-details')) {
      this.currentStep = 0;
    } else if (url.includes('vehicle-details')) {
      this.currentStep = 1;
    } else if (url.includes('income')) {
      this.currentStep = 2;
    }
  }

  getStepClass(index: number): string {
    if (index === this.currentStep) return 'step active';
    if (index < this.currentStep) return 'step completed';
    return 'step locked';
  }

  getStepIcon(index: number): string {
    if (index === this.currentStep) return this.activeIcon;
    if (index < this.currentStep) return this.completedIcon;
    return this.lockedIcon;
  }

  getStepIconAlt(index: number): string {
    if (index === this.currentStep) return 'Current step';
    if (index < this.currentStep) return 'Completed step';
    return 'Locked upcoming step';
  }
}
