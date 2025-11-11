import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VehicleForm } from './features/vehicle-details/components/vehicle-form/vehicle-form';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,VehicleForm],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('New-Car-Loan');
}
