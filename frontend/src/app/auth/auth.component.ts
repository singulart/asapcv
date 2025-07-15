import { Component } from '@angular/core';

@Component({
  selector: 'app-auth',
  standalone: false,
  template: `
    <div class="auth-container">
      <h1>Authentication</h1>
      <p>Login and registration functionality will be implemented here.</p>
    </div>
  `,
  styles: [
    `
      .auth-container {
        max-width: 400px;
        margin: 2rem auto;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
    `,
  ],
})
export class AuthComponent {}