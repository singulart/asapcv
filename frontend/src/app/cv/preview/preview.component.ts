import { Component } from '@angular/core';

@Component({
  selector: 'app-preview',
  template: `
    <div class="preview-container">
      <h2>CV Preview</h2>
      <p>CV preview functionality will be implemented here.</p>
    </div>
  `,
  styles: [
    `
      .preview-container {
        max-width: 800px;
        margin: 2rem auto;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      }
    `,
  ],
})
export class PreviewComponent {}