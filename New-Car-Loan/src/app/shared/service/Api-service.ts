import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { shareReplay, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // Mock saveToCart method for demo
  saveToCart(data: any): Observable<any> {
    // Simulate a backend call
    return of({ success: true });
  }
  private cache: { [url: string]: Observable<any> } = {};

  constructor(private http: HttpClient) {}

  
  getData(url: string): Observable<any> {
    // If cached, return existing observable
    if (this.cache[url]) {
      return this.cache[url];
    }

    // Otherwise, make HTTP call and cache it
    const request$ = this.http.get<any>(url).pipe(
      shareReplay(1) // cache the latest value for all subscribers
    );

    this.cache[url] = request$;
    return request$;
  }
}
