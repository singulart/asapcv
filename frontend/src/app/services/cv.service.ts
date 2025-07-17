import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
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

export interface CvUploadMetadata {
  filename: string;
  fileType: string;
  fileSize: number;
  title?: string;
}

export interface CvUploadResponse {
  cvId: string;
  s3Key: string;
  uploadUrl: string;
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

  /**
   * Step 1: Get a presigned URL for uploading a CV file to S3
   * @param metadata File metadata including filename, fileType, fileSize, and optional title
   * @returns Observable with presigned URL and upload metadata
   */
  getPresignedUploadUrl(metadata: CvUploadMetadata): Observable<CvUploadResponse> {
    return this.http.post<CvUploadResponse>(`${this.apiUrl}/upload`, metadata, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('Error getting presigned URL:', error);
        throw error;
      })
    );
  }

  /**
   * Step 2: Upload file directly to S3 using the presigned URL
   * @param presignedUrl The S3 presigned URL for upload
   * @param file The file to upload
   * @param fileType The MIME type of the file
   * @returns Observable of the HTTP response
   */
  uploadFileToS3(presignedUrl: string, file: File, fileType: string): Observable<any> {
    const headers = new HttpHeaders({
    'Content-Type': fileType || 'application/octet-stream'
    });
    console.log(presignedUrl);
    return this.http.put(presignedUrl, file, {
      headers: headers,
      reportProgress: true,
      observe: 'response'
    }).pipe(
      catchError(error => {
        console.error('S3 upload error:', error);
        throw error;
      })
    );
  }
  
  /**
   * Complete CV upload process (for backward compatibility)
   * @param file File to upload
   * @param title Optional title for the CV
   * @returns Observable that completes when the upload is finished
   */
  uploadCv(file: File, title?: string): Observable<any> {
    return new Observable(observer => {
      // Step 1: Get presigned URL
      const metadata: CvUploadMetadata = {
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        title: title
      };
      
      this.getPresignedUploadUrl(metadata).subscribe({
        next: (response) => {
          // Step 2: Upload file to S3
          this.uploadFileToS3(response.uploadUrl, file, file.type).subscribe({
            next: () => {
              observer.next(response);
              observer.complete();
            },
            error: (error) => observer.error(error)
          });
        },
        error: (error) => observer.error(error)
      });
    });
  }

  getCvVersions(): Observable<CvVersion[]> {
    return this.http.get<CvVersion[]>(`${this.apiUrl}/versions`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('Error fetching CV versions:', error);
        throw error;
      })
    );
  }

  getCvById(cvId: string): Observable<CvVersion> {
    return this.http.get<CvVersion>(`${this.apiUrl}/versions/${cvId}`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('Error fetching CV:', error);
        throw error;
      })
    );
  }

  deleteCv(cvId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/versions/${cvId}`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('Error deleting CV:', error);
        throw error;
      })
    );
  }

  tailorCv(request: TailorCvRequest): Observable<TailorCvResponse> {
    return this.http.post<TailorCvResponse>(`${this.apiUrl}/tailor`, request, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('CV tailoring error:', error);
        throw error;
      })
    );
  }

  previewCv(cvId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/preview/${cvId}`, { withCredentials: true }).pipe(
      catchError(error => {
        console.error('Error fetching CV preview:', error);
        throw error;
      })
    );
  }

  downloadCv(cvId: string): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/download/${cvId}`, {}, { withCredentials: true,
      responseType: 'blob'
    }).pipe(
      catchError(error => {
        console.error('Error downloading CV:', error);
        throw error;
      })
    );
  }

  analyzeJob(jobUrl: string): Observable<any> {
    return this.http.post(`/api/job/analyze`, { url: jobUrl }, { withCredentials: true }).pipe(
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