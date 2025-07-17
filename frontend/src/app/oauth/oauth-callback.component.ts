import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: false,
  template: `
    <div class="oauth-callback-container">
      <div class="oauth-callback-card">
        <div class="loading-content">
          <div class="spinner"></div>
          <h2>Completing authentication...</h2>
          <p>Please wait while we verify your credentials.</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .oauth-callback-container {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .oauth-callback-card {
        width: 100%;
        max-width: 400px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        padding: 3rem 2rem;
      }

      .loading-content {
        text-align: center;
      }

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 2rem;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      h2 {
        color: #333;
        margin-bottom: 1rem;
        font-size: 1.5rem;
        font-weight: 600;
      }

      p {
        color: #666;
        font-size: 1rem;
        line-height: 1.5;
      }

      /* Mobile Responsive */
      @media (max-width: 480px) {
        .oauth-callback-container {
          padding: 0.5rem;
        }

        .oauth-callback-card {
          padding: 2rem 1.5rem;
        }

        h2 {
          font-size: 1.25rem;
        }

        p {
          font-size: 0.9rem;
        }
      }
    `,
  ],
})
export class OAuthCallbackComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.handleOAuthCallback();
  }

  private handleOAuthCallback(): void {
    // Call the backend to get user profile after OAuth
    this.authService.getProfile().subscribe({
      next: (response) => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('OAuth authentication error:', error);
        // Redirect to auth page with error message
        this.router.navigate(['/auth'], {
          queryParams: { error: 'Authentication error' }
        });
      }
    });
  }
}