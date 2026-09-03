import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

type IframeReadyMessage = {
  type: 'commerceos:iframe-ready';
  payload: {
    clientId: string;
    redirectUri: string;
    scope: string[];
    codeChallenge: string;
    codeChallengeMethod: 'S256';
    state: string;
  };
};

type IframeAuthorizationResponse = {
  data: {
    code: string;
    expiresIn: number;
    scope: string[];
  };
};

@Component({
  selector: 'app-django-insights',
  template: `
    <section class="django-insights-page">
      <div class="frame-toolbar">
        <div>
          <p class="eyebrow">Django Remote</p>
          <h1>Commerce Insights</h1>
        </div>
        <button type="button" class="btn-secondary compact" (click)="authorizeIframe()">
          <i class="bi bi-arrow-clockwise"></i>
          Refresh Session
        </button>
      </div>

      <iframe
        #frame
        class="django-insights-frame"
        title="Commerce Insights"
        [src]="iframeUrl"
        sandbox="allow-scripts allow-same-origin allow-forms"
        referrerpolicy="same-origin"
      ></iframe>
    </section>
  `,
  styles: `
    :host {
      display: contents;
    }

    .django-insights-page {
      display: grid;
      gap: 1rem;
      min-height: calc(100dvh - 2rem);
    }

    .frame-toolbar {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 1rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: #fff;
      padding: 1rem;
      box-shadow: var(--shadow-sm);
    }

    .frame-toolbar h1,
    .frame-toolbar p {
      margin-bottom: 0;
    }

    .django-insights-frame {
      width: 100%;
      min-height: calc(100dvh - 9.5rem);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: #fff;
      box-shadow: var(--shadow-sm);
    }

    @media (max-width: 680px) {
      .frame-toolbar {
        align-items: start;
        flex-direction: column;
      }

      .django-insights-frame {
        min-height: calc(100dvh - 12rem);
      }
    }
  `,
})
export class DjangoInsightsComponent implements AfterViewInit, OnDestroy {
  @ViewChild('frame', { static: true })
  private readonly frame!: ElementRef<HTMLIFrameElement>;

  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
  private latestReadyMessage: IframeReadyMessage | null = null;

  readonly iframeUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    environment.djangoInsightsUrl,
  );

  private readonly targetOrigin = new URL(environment.djangoInsightsUrl, window.location.origin)
    .origin;

  private readonly receiveMessage = (event: MessageEvent) => {
    if (event.source !== this.frame.nativeElement.contentWindow) {
      return;
    }

    if (event.origin !== this.targetOrigin) {
      return;
    }

    if (this.isIframeReadyMessage(event.data)) {
      this.latestReadyMessage = event.data;
      void this.authorizeIframe();
    }
  };

  ngAfterViewInit(): void {
    window.addEventListener('message', this.receiveMessage);
  }

  ngOnDestroy(): void {
    window.removeEventListener('message', this.receiveMessage);
  }

  async authorizeIframe(): Promise<void> {
    if (!this.latestReadyMessage) {
      this.frame.nativeElement.contentWindow?.location.reload();
      return;
    }

    const request = this.latestReadyMessage.payload;
    try {
      const response = await firstValueFrom(
        this.http.post<IframeAuthorizationResponse>(`${environment.apiUrl}/auth/iframe/authorization`, {
          clientId: request.clientId,
          redirectUri: request.redirectUri,
          scope: request.scope,
          codeChallenge: request.codeChallenge,
          codeChallengeMethod: request.codeChallengeMethod,
        }),
      );

      this.frame.nativeElement.contentWindow?.postMessage(
        {
          type: 'commerceos:authorization-code',
          payload: {
            code: response.data.code,
            state: request.state,
            expiresIn: response.data.expiresIn,
          },
        },
        this.targetOrigin,
      );
    } catch {
      this.frame.nativeElement.contentWindow?.postMessage(
        {
          type: 'commerceos:authorization-code',
          payload: {
            code: '',
            state: request.state,
          },
        },
        this.targetOrigin,
      );
    }
  }

  private isIframeReadyMessage(value: unknown): value is IframeReadyMessage {
    if (!value || typeof value !== 'object') return false;
    const message = value as Partial<IframeReadyMessage>;
    const payload = message.payload as Partial<IframeReadyMessage['payload']> | undefined;

    return (
      message.type === 'commerceos:iframe-ready' &&
      !!payload &&
      typeof payload.clientId === 'string' &&
      typeof payload.redirectUri === 'string' &&
      Array.isArray(payload.scope) &&
      payload.scope.every((scope) => typeof scope === 'string') &&
      typeof payload.codeChallenge === 'string' &&
      payload.codeChallengeMethod === 'S256' &&
      typeof payload.state === 'string'
    );
  }
}
