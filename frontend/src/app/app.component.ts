import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [
    `
      .app-container {
        min-height: 100vh;
        background-color: #f5f5f5;
      }
    `,
  ],
})
export class AppComponent {
  title = 'ASAP CV';
}