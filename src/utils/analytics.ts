export const GA_TRACKING_ID = 'UA-138977349-1';

export const pageView = (url: string) => {
  window.gtag('config', GA_TRACKING_ID, {
    page_path: url,
  });
};

export const event = (category: string, action: string, label?: string, value?: string) => {
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value,
  });
};
