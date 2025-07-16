import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, User } from '../services/auth.service';
import { CvService } from '../services/cv.service';

export interface CvVersion {
  cvId: string;
  title: string;
  isBase: boolean;
  jobUrl?: string;
  createdAt: Date;
  modifiedSections: string[];
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-content">
          <div class="user-info">
            <h1>Welcome back, {{ getFirstName() }}!</h1>
            <p>Ready to tailor your CV for your next opportunity?</p>
          </div>
          <div class="header-actions">
            <button class="btn btn-outline" (click)="navigateToProfile()">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              Profile
            </button>
            <button class="btn btn-outline" (click)="logout()">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </header>

      <!-- Quick Actions -->
      <section class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="actions-grid">
          <div class="action-card primary" (click)="uploadNewCv()">
            <div class="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
            </div>
            <h3>Upload New CV</h3>
            <p>Upload your base CV to get started with tailoring</p>
          </div>

          <div class="action-card" (click)="tailorCv()" [class.disabled]="!hasBaseCv">
            <div class="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
              </svg>
            </div>
            <h3>Tailor CV</h3>
            <p>Create a tailored version for a specific job</p>
          </div>

          <div class="action-card" (click)="viewCvVersions()">
            <div class="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
            </div>
            <h3>My CV Versions</h3>
            <p>View and manage all your CV versions</p>
          </div>
        </div>
      </section>

      <!-- CV Versions Overview -->
      <section class="cv-overview">
        <div class="section-header">
          <h2>Recent CV Versions</h2>
          <button class="btn btn-text" (click)="viewCvVersions()" *ngIf="cvVersions.length > 3">
            View All
          </button>
        </div>

        <!-- Loading State -->
        <div class="loading-state" *ngIf="isLoading">
          <div class="spinner"></div>
          <p>Loading your CV versions...</p>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!isLoading && cvVersions.length === 0">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14,2 14,8 20,8"></polyline>
            </svg>
          </div>
          <h3>No CV versions yet</h3>
          <p>Upload your first CV to get started with tailoring</p>
          <button class="btn btn-primary" (click)="uploadNewCv()">
            Upload CV
          </button>
        </div>

        <!-- CV Versions List -->
        <div class="cv-list" *ngIf="!isLoading && cvVersions.length > 0">
          <div 
            class="cv-card" 
            *ngFor="let cv of displayedCvVersions; trackBy: trackByCvId"
            (click)="viewCvDetails(cv)">
            <div class="cv-header">
              <div class="cv-title">
                <h3>{{ cv.title }}</h3>
                <span class="cv-badge" [class.base]="cv.isBase">
                  {{ cv.isBase ? 'Base CV' : 'Tailored' }}
                </span>
              </div>
              <div class="cv-date">
                {{ formatDate(cv.createdAt) }}
              </div>
            </div>
            
            <div class="cv-details" *ngIf="!cv.isBase">
              <p class="job-url" *ngIf="cv.jobUrl">
                <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                {{ getJobUrlDomain(cv.jobUrl) }}
              </p>
              <div class="modified-sections" *ngIf="cv.modifiedSections.length > 0">
                <span class="section-tag" *ngFor="let section of cv.modifiedSections.slice(0, 3)">
                  {{ section }}
                </span>
                <span class="more-sections" *ngIf="cv.modifiedSections.length > 3">
                  +{{ cv.modifiedSections.length - 3 }} more
                </span>
              </div>
            </div>

            <div class="cv-actions">
              <button class="btn btn-sm btn-outline" (click)="downloadCv(cv, $event)">
                <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7,10 12,15 17,10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download
              </button>
              <button class="btn btn-sm btn-outline" (click)="previewCv(cv, $event)">
                <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                Preview
              </button>
              <button 
                class="btn btn-sm btn-text" 
                (click)="deleteCv(cv, $event)"
                *ngIf="!cv.isBase">
                Delete
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="stats-section" *ngIf="cvVersions.length > 0">
        <h2>Your Stats</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-number">{{ cvVersions.length }}</div>
            <div class="stat-label">Total CVs</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ tailoredCvCount }}</div>
            <div class="stat-label">Tailored Versions</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ recentCvCount }}</div>
            <div class="stat-label">This Month</div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem;
        min-height: 100vh;
      }

      /* Header */
      .dashboard-header {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        padding: 2rem;
        margin-bottom: 2rem;
        color: white;
      }

      .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }

      .user-info h1 {
        font-size: 2rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .user-info p {
        opacity: 0.9;
        font-size: 1.1rem;
      }

      .header-actions {
        display: flex;
        gap: 1rem;
      }

      .btn-outline {
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.3);
        color: white;
        backdrop-filter: blur(10px);
      }

      .btn-outline:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.5);
      }

      /* Quick Actions */
      .quick-actions {
        margin-bottom: 3rem;
      }

      .quick-actions h2 {
        margin-bottom: 1.5rem;
        color: #333;
        font-size: 1.5rem;
        font-weight: 600;
      }

      .actions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1.5rem;
      }

      .action-card {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        border: 2px solid transparent;
        cursor: pointer;
        transition: all 0.3s ease;
        text-align: center;
      }

      .action-card:hover:not(.disabled) {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        border-color: #667eea;
      }

      .action-card.primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }

      .action-card.primary:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        border-color: transparent;
      }

      .action-card.disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .action-icon {
        width: 48px;
        height: 48px;
        margin: 0 auto 1rem;
        opacity: 0.8;
      }

      .action-icon svg {
        width: 100%;
        height: 100%;
      }

      .action-card h3 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 0.5rem;
      }

      .action-card p {
        opacity: 0.8;
        line-height: 1.5;
      }

      /* CV Overview */
      .cv-overview {
        margin-bottom: 3rem;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }

      .section-header h2 {
        color: #333;
        font-size: 1.5rem;
        font-weight: 600;
      }

      .btn-text {
        background: none;
        border: none;
        color: #667eea;
        font-weight: 500;
        cursor: pointer;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        transition: background-color 0.2s ease;
      }

      .btn-text:hover {
        background: rgba(102, 126, 234, 0.1);
      }

      /* Loading State */
      .loading-state {
        text-align: center;
        padding: 3rem;
        color: #666;
      }

      .spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Empty State */
      .empty-state {
        text-align: center;
        padding: 3rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }

      .empty-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 1rem;
        opacity: 0.4;
      }

      .empty-icon svg {
        width: 100%;
        height: 100%;
        stroke: #666;
      }

      .empty-state h3 {
        color: #333;
        margin-bottom: 0.5rem;
        font-size: 1.25rem;
      }

      .empty-state p {
        color: #666;
        margin-bottom: 1.5rem;
      }

      /* CV List */
      .cv-list {
        display: grid;
        gap: 1rem;
      }

      .cv-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        border: 2px solid transparent;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .cv-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        border-color: #667eea;
      }

      .cv-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1rem;
      }

      .cv-title {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .cv-title h3 {
        color: #333;
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0;
      }

      .cv-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 500;
        background: #e3f2fd;
        color: #1976d2;
      }

      .cv-badge.base {
        background: #e8f5e8;
        color: #2e7d32;
      }

      .cv-date {
        color: #666;
        font-size: 0.875rem;
      }

      .cv-details {
        margin-bottom: 1rem;
      }

      .job-url {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #666;
        font-size: 0.875rem;
        margin-bottom: 0.75rem;
      }

      .modified-sections {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }

      .section-tag {
        padding: 0.25rem 0.5rem;
        background: #f5f5f5;
        border-radius: 4px;
        font-size: 0.75rem;
        color: #666;
      }

      .more-sections {
        padding: 0.25rem 0.5rem;
        background: #667eea;
        color: white;
        border-radius: 4px;
        font-size: 0.75rem;
      }

      .cv-actions {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }

      .btn-sm {
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
        border-radius: 6px;
      }

      .icon, .icon-small {
        width: 16px;
        height: 16px;
        stroke-width: 2;
      }

      /* Stats Section */
      .stats-section {
        background: white;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
      }

      .stats-section h2 {
        color: #333;
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1.5rem;
      }

      .stat-card {
        text-align: center;
        padding: 1.5rem;
        background: #f8f9fa;
        border-radius: 8px;
      }

      .stat-number {
        font-size: 2rem;
        font-weight: 700;
        color: #667eea;
        margin-bottom: 0.5rem;
      }

      .stat-label {
        color: #666;
        font-size: 0.875rem;
        font-weight: 500;
      }

      /* Responsive Design */
      @media (max-width: 768px) {
        .dashboard-container {
          padding: 0.5rem;
        }

        .dashboard-header {
          padding: 1.5rem;
        }

        .header-content {
          flex-direction: column;
          text-align: center;
        }

        .user-info h1 {
          font-size: 1.5rem;
        }

        .actions-grid {
          grid-template-columns: 1fr;
        }

        .action-card {
          padding: 1.5rem;
        }

        .cv-header {
          flex-direction: column;
          gap: 0.5rem;
          align-items: flex-start;
        }

        .cv-actions {
          flex-wrap: wrap;
        }

        .stats-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      @media (max-width: 480px) {
        .header-actions {
          flex-direction: column;
          width: 100%;
        }

        .stats-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  cvVersions: CvVersion[] = [];
  isLoading = true;
  hasBaseCv = false;

  constructor(
    private authService: AuthService,
    private cvService: CvService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadCvVersions();
  }

  private loadUserData(): void {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });
  }

  private loadCvVersions(): void {
    this.isLoading = true;
    this.cvService.getCvVersions().subscribe({
      next: (versions) => {
        this.cvVersions = versions.map((cv: any) => ({
          ...cv,
          createdAt: new Date(cv.createdAt)
        }));
        this.hasBaseCv = this.cvVersions.some(cv => cv.isBase);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading CV versions:', error);
        this.isLoading = false;
      }
    });
  }

  get displayedCvVersions(): CvVersion[] {
    return this.cvVersions.slice(0, 3);
  }

  get tailoredCvCount(): number {
    return this.cvVersions.filter(cv => !cv.isBase).length;
  }

  get recentCvCount(): number {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return this.cvVersions.filter(cv => cv.createdAt > oneMonthAgo).length;
  }

  uploadNewCv(): void {
    this.router.navigate(['/cv/upload']);
  }

  tailorCv(): void {
    if (!this.hasBaseCv) return;
    this.router.navigate(['/cv/job-url']);
  }

  viewCvVersions(): void {
    this.router.navigate(['/cv']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
  }

  viewCvDetails(cv: CvVersion): void {
    this.router.navigate(['/cv/preview', cv.cvId]);
  }

  downloadCv(cv: CvVersion, event: Event): void {
    event.stopPropagation();
    this.cvService.downloadCv(cv.cvId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${cv.title}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error downloading CV:', error);
      }
    });
  }

  previewCv(cv: CvVersion, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/cv/preview', cv.cvId]);
  }

  deleteCv(cv: CvVersion, event: Event): void {
    event.stopPropagation();
    if (cv.isBase) return;

    if (confirm(`Are you sure you want to delete "${cv.title}"?`)) {
      this.cvService.deleteCv(cv.cvId).subscribe({
        next: () => {
          this.cvVersions = this.cvVersions.filter(v => v.cvId !== cv.cvId);
        },
        error: (error) => {
          console.error('Error deleting CV:', error);
        }
      });
    }
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    
    return date.toLocaleDateString();
  }

  getJobUrlDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  }

  getFirstName(): string {
    if (!this.user?.fullName) return 'User';
    return this.user.fullName.split(' ')[0] || 'User';
  }

  trackByCvId(index: number, cv: CvVersion): string {
    return cv.cvId;
  }
}