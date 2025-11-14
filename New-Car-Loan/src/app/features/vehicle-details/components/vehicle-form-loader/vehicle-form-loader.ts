import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-vehicle-form-loader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vehicle-form-loader.html',
  styleUrl: './vehicle-form-loader.css',
})
export class VehicleFormLoader {
  @Input({ required: true })
  brand!: string;

  @Input({ required: true })
  model!: string;

  @Input({ required: true })
  dealer!: string;
}
