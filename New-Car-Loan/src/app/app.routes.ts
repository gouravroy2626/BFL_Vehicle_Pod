import { Routes } from '@angular/router';
import { PersonalForm } from './features/personal-details/components/personal-form/personal-form';
import { VehicleForm } from './features/vehicle-details/components/vehicle-form/vehicle-form';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'personal-details' },
  { path: 'personal-details', component: PersonalForm },
  { path: 'vehicle-details', component: VehicleForm }
];
