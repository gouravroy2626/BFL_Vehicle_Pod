import { Component } from '@angular/core';

import { Router } from '@angular/router';

@Component({
    selector: 'app-vehicle-application-submission',
    standalone: true,
    imports: [],
    templateUrl: './application-submission.html',
    styleUrls: ['./application-submission.css']
})
export class VehicleApplicationSubmissionComponent {

    showDocumentsModal = false;

    openDocumentsModal(): void {
        this.showDocumentsModal = true;
    }

    closeDocumentsModal(): void {
        this.showDocumentsModal = false;
    }

}
