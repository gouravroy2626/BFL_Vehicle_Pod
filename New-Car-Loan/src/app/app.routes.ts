import { VehicleFormLoader } from './features/vehicle-details/components/vehicle-form-loader/vehicle-form-loader';
import { PersonalForm } from './features/personal-details/components/personal-form/personal-form';
import { VehicleForm } from './features/vehicle-details/components/vehicle-form/vehicle-form';
import { AccountAggregator } from './features/vehicle-details/components/account-aggregator/account-aggregator';
import { VehicleApplicationSubmissionComponent } from './features/vehicle-details/components/application-submission/application-submission';
import { Routes } from '@angular/router';


export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'personal-details' },
    { path: 'personal-details', component: PersonalForm },
    { path: 'vehicle-details', component: VehicleForm },
    { path: 'vehicle-loader', component: VehicleFormLoader },
    { path: 'account-aggregator', component: AccountAggregator },
    { path: 'application-submission', component: VehicleApplicationSubmissionComponent }

];
