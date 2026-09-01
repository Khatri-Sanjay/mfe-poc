import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <section class="empty-state" role="status">
      <i [class]="icon()"></i>
      <h2>{{ title() }}</h2>
      <p>{{ message() }}</p>
      <ng-content />
    </section>
  `,
})
export class EmptyStateComponent {
  readonly icon = input('bi bi-inbox');
  readonly title = input('Nothing here yet');
  readonly message = input('Try changing filters or come back later.');
}
