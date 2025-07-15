import { Component } from '@angular/core';

@Component({
  selector: 'app-profile',
  standalone: false,
  template: `
    <div class="profile-container">
      <h2>User Profile</h2>
      <p>User profile management functionality will be implemented here.</p>
    </div>
  `,
  styles: [
    `
      .profile-container {
        max-width: 600px;
        margin: 2rem auto;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
    `,
  ],
})
export class ProfileComponent {}