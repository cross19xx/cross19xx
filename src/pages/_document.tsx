import React from 'react';
import NextDocument, { Head, Html, Main, NextScript } from 'next/document';

import { GA_TRACKING_ID } from '_/utils/analytics';

export default class Document extends NextDocument {
  render() {
    return (
      <Html lang="en-GH">
        <Head>
          <link rel="icon" href="/img/logo-512x512.jpeg" />
        </Head>

        <body className="app--light">
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`} />

          <script
            id="app-theme"
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    const mode = localStorage.getItem('mode');
                    const supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches === true;
  
                    if (!mode && supportDarkMode) document.body.className = 'app--dark';
                    if (!mode) return;
  
                    document.body.className = 'app--' + mode;
                  } catch(error) {
                  }
                })()`,
            }}
          />

          <script
            dangerouslySetInnerHTML={{
              __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag() {
                dataLayer.push(arguments);
              }
                gtag('js', new Date());
                gtag('config', '${GA_TRACKING_ID}', {
                page_path: window.location.pathname,
              });
              `,
            }}
          />

          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
