import { Component, ViewEncapsulation } from '@angular/core';
import { Tracker } from '../../../../shared/components/tracker/tracker';

@Component({
  selector: 'app-vehicle-form',
  imports: [Tracker],
  templateUrl: './vehicle-form.html',
  styleUrls: ['./vehicle-form.css'],
  encapsulation: ViewEncapsulation.None,
})
export class VehicleForm {

}
