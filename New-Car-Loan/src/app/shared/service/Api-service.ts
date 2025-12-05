import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private cache: { [url: string]: Observable<any> } = {};
  
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000;

  constructor(private http: HttpClient) {}

  getData(url: string): Observable<any> {
    
    const now = Date.now();

    // 1. Check localStorage first
    const cached = localStorage.getItem(url);
    if (cached) {
      const parsed = JSON.parse(cached);
      if ((now - parsed.timestamp) < this.CACHE_DURATION) {
        console.log('[ApiService] Returning localStorage cached response for URL:', url);
        return of(parsed.data); 
      } else {
        console.log('[ApiService] Cache expired for URL:', url);
        localStorage.removeItem(url);
      }
    }

    // 2. If not in localStorage, check in-memory cache
    if (this.cache[url]) {
      console.log('[ApiService] Returning in-memory cached response for URL:', url);
      return this.cache[url];
    }

    // 3. Otherwise, make HTTP call and cache it
    console.log('[ApiService] Performing HTTP GET for URL:', url);
    const request$ = this.http.get<any>(url).pipe(
      shareReplay(1),
      tap(data => {
        localStorage.setItem(url, JSON.stringify({ timestamp: now, data }));
      })
    );

    this.cache[url] = request$;
    return request$;
  }

  clearCache(url?: string) {
    if (url) {
      delete this.cache[url];
      localStorage.removeItem(url);
    } else {
      this.cache = {};
      localStorage.clear();
    }
  }
}

