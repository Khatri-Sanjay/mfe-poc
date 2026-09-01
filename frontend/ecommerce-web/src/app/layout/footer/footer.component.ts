import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="app-footer">
      <span>CommerceOS storefront</span>
      <span>Backend: NestJS REST API /api/v1</span>
    </footer>
  `,
})
export class FooterComponent {}
