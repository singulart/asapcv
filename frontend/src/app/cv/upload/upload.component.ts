import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CvService, CvUploadResponse } from '../../services/cv.service';
import { HttpEventType, HttpResponse } from '@angular/common/http';

@Component({
  selector: 'app-upload',
  standalone: false,
  template: `
    <div class="upload-container">
      <h2>Upload Your CV</h2>
      
      <div class="upload-instructions">
        <p>Upload your CV to get started. We accept PDF, DOC, and DOCX formats.</p>
        <p>Maximum file size: 10MB</p>
      </div>
      
      <form [formGroup]="uploadForm" (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="title">CV Title (Optional)</label>
          <input 
            type="text" 
            id="title" 
            formControlName="title" 
            placeholder="e.g., Software Engineer CV"
            class="form-control"
          >
        </div>
        
        <div 
          class="drop-zone" 
          [class.active]="isDragging" 
          [class.has-file]="selectedFile"
          (dragover)="onDragOver($event)" 
          (dragleave)="onDragLeave($event)" 
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
        >
          <input 
            #fileInput
            type="file" 
            id="file" 
            (change)="onFileSelected($event)"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            style="display: none;"
          >
          
          <div *ngIf="!selectedFile" class="drop-message">
            <div class="upload-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <p>Drag and drop your CV here or click to browse</p>
          </div>
          
          <div *ngIf="selectedFile" class="file-info">
            <div class="file-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div class="file-details">
              <p class="file-name">{{ selectedFile.name }}</p>
              <p class="file-size">{{ formatFileSize(selectedFile.size) }}</p>
            </div>
            <button type="button" class="remove-file" (click)="removeFile($event)">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>
        
        <div *ngIf="fileError" class="error-message">
          {{ fileError }}
        </div>
        
        <div *ngIf="uploadProgress > 0 && uploadProgress < 100" class="progress-container">
          <div class="progress-bar" [style.width.%]="uploadProgress"></div>
          <span class="progress-text">{{ uploadProgress }}%</span>
        </div>
        
        <div class="form-actions">
          <button 
            type="submit" 
            class="btn-primary" 
            [disabled]="!selectedFile || isUploading || !isValidFileType"
          >
            <span *ngIf="!isUploading">Upload CV</span>
            <span *ngIf="isUploading">Uploading...</span>
          </button>
        </div>
      </form>
      
      <div *ngIf="uploadSuccess" class="success-message">
        <div class="success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="success-text">
          <h3>Upload Successful!</h3>
          <p>Your CV has been uploaded successfully.</p>
        </div>
        <div class="success-actions">
          <button class="btn-secondary" (click)="goToDashboard()">Go to Dashboard</button>
          <button class="btn-primary" (click)="goToJobUrl()">Continue to Job URL</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .upload-container {
        max-width: 600px;
        margin: 2rem auto;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
      
      h2 {
        margin-top: 0;
        color: #333;
        font-size: 1.8rem;
        margin-bottom: 1.5rem;
      }
      
      .upload-instructions {
        margin-bottom: 1.5rem;
        color: #555;
      }
      
      .form-group {
        margin-bottom: 1.5rem;
      }
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
      }
      
      .form-control {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 1rem;
      }
      
      .drop-zone {
        border: 2px dashed #ccc;
        border-radius: 8px;
        padding: 2rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        margin-bottom: 1.5rem;
        background-color: #f9f9f9;
      }
      
      .drop-zone.active {
        border-color: #4a90e2;
        background-color: rgba(74, 144, 226, 0.05);
      }
      
      .drop-zone.has-file {
        background-color: #f0f7ff;
        border-color: #4a90e2;
      }
      
      .drop-message {
        color: #666;
      }
      
      .upload-icon {
        margin-bottom: 1rem;
        color: #999;
      }
      
      .file-info {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      
      .file-icon {
        color: #4a90e2;
        margin-right: 1rem;
      }
      
      .file-details {
        flex-grow: 1;
        text-align: left;
      }
      
      .file-name {
        margin: 0;
        font-weight: 500;
        color: #333;
        word-break: break-all;
      }
      
      .file-size {
        margin: 0;
        color: #666;
        font-size: 0.9rem;
      }
      
      .remove-file {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.2s ease;
      }
      
      .remove-file:hover {
        background-color: #f1f1f1;
        color: #d9534f;
      }
      
      .error-message {
        color: #d9534f;
        margin-bottom: 1rem;
        padding: 0.5rem;
        background-color: rgba(217, 83, 79, 0.1);
        border-radius: 4px;
      }
      
      .progress-container {
        height: 8px;
        background-color: #f1f1f1;
        border-radius: 4px;
        margin-bottom: 1.5rem;
        position: relative;
        overflow: hidden;
      }
      
      .progress-bar {
        height: 100%;
        background-color: #4a90e2;
        border-radius: 4px;
        transition: width 0.3s ease;
      }
      
      .progress-text {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 0.75rem;
        color: #333;
      }
      
      .form-actions {
        display: flex;
        justify-content: flex-end;
      }
      
      .btn-primary {
        background-color: #4a90e2;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .btn-primary:hover:not(:disabled) {
        background-color: #3a80d2;
      }
      
      .btn-primary:disabled {
        background-color: #a0c3f0;
        cursor: not-allowed;
      }
      
      .success-message {
        background-color: #e8f5e9;
        border-radius: 8px;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      
      .success-icon {
        color: #4caf50;
        margin-bottom: 1rem;
      }
      
      .success-text h3 {
        margin-top: 0;
        color: #2e7d32;
      }
      
      .success-text p {
        color: #555;
      }
      
      .success-actions {
        margin-top: 1.5rem;
        display: flex;
        gap: 1rem;
      }
      
      .btn-secondary {
        background-color: #f1f1f1;
        color: #333;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .btn-secondary:hover {
        background-color: #e1e1e1;
      }
    `,
  ],
})
export class UploadComponent implements OnInit {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  fileError: string | null = null;
  isDragging = false;
  isUploading = false;
  uploadProgress = 0;
  uploadSuccess = false;
  isValidFileType = false;
  
  // Valid MIME types for CV uploads
  private validFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  // Maximum file size (10MB)
  private maxFileSize = 10 * 1024 * 1024;
  
  constructor(
    private fb: FormBuilder,
    private cvService: CvService,
    private router: Router
  ) {
    this.uploadForm = this.fb.group({
      title: ['', [Validators.maxLength(100)]]
    });
  }
  
  ngOnInit(): void {
    // Component initialization logic
  }
  
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }
  
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }
  
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }
  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }
  
  handleFile(file: File): void {
    this.fileError = null;
    
    // Validate file type
    if (!this.validFileTypes.includes(file.type)) {
      this.fileError = 'Invalid file type. Please upload a PDF, DOC, or DOCX file.';
      this.selectedFile = null;
      this.isValidFileType = false;
      return;
    }
    
    // Validate file size
    if (file.size > this.maxFileSize) {
      this.fileError = `File is too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}.`;
      this.selectedFile = null;
      this.isValidFileType = false;
      return;
    }
    
    this.selectedFile = file;
    this.isValidFileType = true;
  }
  
  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    this.fileError = null;
    this.isValidFileType = false;
  }
  
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  onSubmit(): void {
    if (!this.selectedFile || !this.isValidFileType) {
      return;
    }
    
    this.isUploading = true;
    this.uploadProgress = 0;
    
    const title = this.uploadForm.get('title')?.value || this.selectedFile.name.replace(/\.[^/.]+$/, '');
    
    // Step 1: Get presigned URL
    const metadata = {
      filename: this.selectedFile.name,
      fileType: this.selectedFile.type,
      fileSize: this.selectedFile.size,
      title: title
    };
    
    this.cvService.getPresignedUploadUrl(metadata).subscribe({
      next: (response: CvUploadResponse) => {
        // Step 2: Upload file to S3
        this.cvService.uploadFileToS3(response.uploadUrl, this.selectedFile!, this.selectedFile!.type).subscribe({
          next: (event: any) => {
            if (event.type === HttpEventType.UploadProgress) {
              this.uploadProgress = Math.round(100 * event.loaded / event.total);
            } else if (event instanceof HttpResponse) {
              this.uploadSuccess = true;
              this.isUploading = false;
            }
          },
          error: (error) => {
            this.isUploading = false;
            this.fileError = 'Failed to upload file. Please try again.';
            console.error('S3 upload error:', error);
          }
        });
      },
      error: (error) => {
        this.isUploading = false;
        this.fileError = 'Failed to get upload URL. Please try again.';
        console.error('Error getting presigned URL:', error);
      }
    });
  }
  
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
  
  goToJobUrl(): void {
    this.router.navigate(['/cv/job-url']);
  }
}