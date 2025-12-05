import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private cache: { [url: string]: Observable<any> } = {};

  constructor(private http: HttpClient) {}

  
  getData(url: string): Observable<any> {
    // If cached, return existing observable
    if (this.cache[url]) {
      console.log('[ApiService] Returning cached response for URL:', url);
      return this.cache[url];
    }

    // Otherwise, make HTTP call and cache it
    console.log('[ApiService] Performing HTTP GET for URL:', url);
    const request$ = this.http.get<any>(url).pipe(
      shareReplay(1) // cache the latest value for all subscribers
    );

    this.cache[url] = request$;
    return request$;
  }
}
