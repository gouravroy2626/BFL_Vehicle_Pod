import { Routes } from '@angular/router';
import { VehicleForm } from './features/vehicle-details/components/vehicle-form/vehicle-form';
import { AccountAggregator } from './features/vehicle-details/components/account-aggregator/account-aggregator';

export const routes: Routes = [
    {
        path: '',
        component: VehicleForm,
    },
    {
        path: 'account-aggregator',
        component: AccountAggregator,
    },
    {
        path: '**',
        redirectTo: '',
    },
];
