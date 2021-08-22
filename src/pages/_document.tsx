import React from 'react';
import NextDocument, { Head, Html, Main, NextScript } from 'next/document';

export default class Document extends NextDocument {
  render() {
    return (
      <Html lang="en-GH">
        <Head>
          <link rel="icon" href="/img/logo-512x512.jpeg" />
        </Head>

        <body className="app--light">
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

          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
