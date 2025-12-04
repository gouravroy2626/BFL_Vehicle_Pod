import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoaderScreenService {
  private readonly loaderUrl =
    'https://cms-api.bajajfinserv.in/content/bajajfinserv/oneweb-api/in/en/forms/new-car-finance/v1/loader';

  constructor(private http: HttpClient) {}

  getLoaderScreenData(): Observable<any> {
    return this.http.get<any>(this.loaderUrl);
  }
}
