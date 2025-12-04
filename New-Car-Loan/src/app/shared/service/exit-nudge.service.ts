import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './Api-service';

@Injectable({ providedIn: 'root' })
export class ExitNudgeService {
  private readonly url =
    'https://cms-api.bajajfinserv.in/content/bajajfinserv/oneweb-api/in/en/forms/new-car-finance/v1/exit-nudge';

  constructor(private apiService: ApiService) {}

  getScreenContent(): Observable<any[]> {
    return this.apiService.getData(this.url).pipe(
      map((data: any) => data?.content?.[0]?.screenContent ?? [])
    );
  }

  getByKey(key: string): Observable<any | undefined> {
    return this.getScreenContent().pipe(
      map((screens: any[]) => screens.find((s: any) => s?.key === key))
    );
  }
}
