import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface CvVersion {
  cvId: string;
  title: string;
  isBase: boolean;
  jobUrl?: string;
  createdAt: string;
  modifiedSections: string[];
}

export interface CvUploadResponse {
  cvId: string;
  message: string;
  extractedSections: string[];
}

export interface TailorCvRequest {
  jobUrl: string;
  baseCvId?: string;
}

export interface TailorCvResponse {
  cvId: string;
  title: string;
  modifiedSections: string[];
  previewUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class CvService {
  private apiUrl = '/api/cv';

  constructor(private http: HttpClient) {}

  uploadCv(file: File, title?: string): Observable<CvUploadResponse> {
    const formData = new FormData();
    formData.append('cv', file);
    if (title) {
      formData.append('title', title);
    }
    
    return this.http.post<CvUploadResponse>(`${this.apiUrl}/upload`, formData).pipe(
      catchError(error => {
        console.error('CV upload error:', error);
        throw error;
      })
    );
  }

  getCvVersions(): Observable<CvVersion[]> {
    return this.http.get<CvVersion[]>(`${this.apiUrl}/versions`).pipe(
      catchError(error => {
        console.error('Error fetching CV versions:', error);
        throw error;
      })
    );
  }

  getCvById(cvId: string): Observable<CvVersion> {
    return this.http.get<CvVersion>(`${this.apiUrl}/versions/${cvId}`).pipe(
      catchError(error => {
        console.error('Error fetching CV:', error);
        throw error;
      })
    );
  }

  deleteCv(cvId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/versions/${cvId}`).pipe(
      catchError(error => {
        console.error('Error deleting CV:', error);
        throw error;
      })
    );
  }

  tailorCv(request: TailorCvRequest): Observable<TailorCvResponse> {
    return this.http.post<TailorCvResponse>(`${this.apiUrl}/tailor`, request).pipe(
      catchError(error => {
        console.error('CV tailoring error:', error);
        throw error;
      })
    );
  }

  previewCv(cvId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/preview/${cvId}`).pipe(
      catchError(error => {
        console.error('Error fetching CV preview:', error);
        throw error;
      })
    );
  }

  downloadCv(cvId: string): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/download/${cvId}`, {}, {
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error downloading CV:', error);
        throw error;
      })
    );
  }

  analyzeJob(jobUrl: string): Observable<any> {
    return this.http.post(`/api/job/analyze`, { url: jobUrl }).pipe(
      catchError(error => {
        console.error('Job analysis error:', error);
        throw error;
      })
    );
  }

  // Utility method to check if user has a base CV
  hasBaseCv(): Observable<boolean> {
    return new Observable(observer => {
      this.getCvVersions().subscribe({
        next: (versions) => {
          const hasBase = versions.some(cv => cv.isBase);
          observer.next(hasBase);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  // Get the user's base CV
  getBaseCv(): Observable<CvVersion | null> {
    return new Observable(observer => {
      this.getCvVersions().subscribe({
        next: (versions) => {
          const baseCv = versions.find(cv => cv.isBase) || null;
          observer.next(baseCv);
          observer.complete();
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }
}