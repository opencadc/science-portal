import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

interface LaunchData {
    baseURL: string;
    sessionsResourceID: string;
    sessionsStandardID: string;
    themeName: string;
    tabLabels: string[];
    bannerText: string;
    contentBase: string;
    headerURLs: Record<string, string>;
}

export interface AppProps {
    initialData: LaunchData;
    config: {
        environment: string;
    };
}

function mount(element: HTMLElement, props: AppProps) {
    if (!element) {
        console.error('Mount element not found');
        return;
    }

    try {
        const root = ReactDOM.createRoot(element);
        root.render(
            <React.StrictMode>
                <App {...props} />
            </React.StrictMode>
        );
    } catch (error) {
        console.error('Error mounting app:', error);
    }
}

// Initialize global namespace immediately
try {
    // Make sure we're in a browser environment
    if (typeof window !== 'undefined') {
        window.SciencePortal = {
            mount: (element: HTMLElement, props: AppProps) => {
                try {
                    mount(element, props);
                } catch (error) {
                    console.error('Error in mount function:', error);
                }
            }
        };
    }
} catch (error) {
    console.error('Error initializing SciencePortal:', error);
}

// Development mode check without using process.env
if (import.meta.env.DEV) {
    const element = document.getElementById('science-portal-root');
    if (element) {
        mount(element, {
            initialData: {
                baseURL: 'http://localhost:5173',
                sessionsResourceID: 'dev-resource-id',
                sessionsStandardID: 'dev-standard-id',
                themeName: 'default',
                tabLabels: ['Tab 1', 'Tab 2'],
                bannerText: 'Development Mode',
                contentBase: '/dist',
                headerURLs: {}
            },
            config: {
                environment: 'development'
            }
        });
    }
}

declare global {
    interface Window {
        SciencePortal: {
            mount: (element: HTMLElement, props: AppProps) => void;
        }
    }
}