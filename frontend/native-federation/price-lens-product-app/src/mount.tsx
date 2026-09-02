import {StrictMode} from 'react';
import {createRoot, type Root} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import './index.css';

export interface PriceLensMountOptions {
    routeBasePath?: string;
}

const styleId = 'price-lens-product-app-styles';

function ensureRemoteStylesheet(): void {
    if (document.getElementById(styleId)) return;

    const stylesheet = document.createElement('link');
    stylesheet.id = styleId;
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('./mount.css', import.meta.url).toString();
    document.head.appendChild(stylesheet);
}

export function mount(element: HTMLElement, options: PriceLensMountOptions = {}) {
    ensureRemoteStylesheet();

    const root: Root = createRoot(element);

    root.render(
        <StrictMode>
            <BrowserRouter basename={options.routeBasePath ?? '/price-lens'}>
                <App/>
            </BrowserRouter>
        </StrictMode>,
    );

    return {
        unmount: () => root.unmount(),
    };
}
