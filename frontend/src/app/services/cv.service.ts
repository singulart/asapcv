import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CvService {
  private apiUrl = '/api/cv';

  constructor(private http: HttpClient) {}

  // CV management methods will be implemented in later tasks
  uploadCv(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('cv', file);
    return this.http.post(`${this.apiUrl}/upload`, formData);
  }

  getCvVersions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/versions`);
  }

  tailorCv(jobUrl: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/tailor`, { jobUrl });
  }
}