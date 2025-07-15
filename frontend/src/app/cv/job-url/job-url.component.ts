import { Component } from '@angular/core';

@Component({
  selector: 'app-job-url',
  standalone: false,
  template: `
    <div class="job-url-container">
      <h2>Job URL Input</h2>
      <p>Job URL input functionality will be implemented here.</p>
    </div>
  `,
  styles: [
    `
      .job-url-container {
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
export class JobUrlComponent {}