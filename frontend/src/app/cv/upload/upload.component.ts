import { Component } from '@angular/core';

@Component({
  selector: 'app-upload',
  template: `
    <div class="upload-container">
      <h2>Upload CV</h2>
      <p>CV upload functionality will be implemented here.</p>
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
    `,
  ],
})
export class UploadComponent {}