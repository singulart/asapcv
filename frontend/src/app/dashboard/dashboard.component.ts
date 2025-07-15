import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  template: `
    <div class="dashboard-container">
      <h1>Dashboard</h1>
      <p>CV management and tailoring functionality will be implemented here.</p>
    </div>
  `,
  styles: [
    `
      .dashboard-container {
        max-width: 1200px;
        margin: 2rem auto;
        padding: 2rem;
      }
    `,
  ],
})
export class DashboardComponent {}