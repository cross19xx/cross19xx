/** Theme of the application. Represents either dark mode or light mode */
export type Theme = 'dark' | 'light';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}
