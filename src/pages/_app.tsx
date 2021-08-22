import React from 'react';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { DefaultSeo, DefaultSeoProps } from 'next-seo';

import { ThemeProvider } from '_/contexts/ThemeContext';

import '_/styles/global.css';

const DEFAULT_SEO: DefaultSeoProps = {
  defaultTitle: 'Kenneth Kwakye-Gyamfi',
  titleTemplate: '%s - Kenneth Kwakye-Gyamfi',
  description: 'Mobile and web developer currently based in Accra, Ghana. Basketball fan',
  openGraph: {
    title: 'Kenneth Kwakye-Gyamfi',
    url: 'https://www.kwakye-gyamfi.com',
    site_name: 'Kenneth Kwakye-Gyamfi - Mobile and web developer',
    description: 'Mobile and web developer currently based in Accra, Ghana. Basketball fan',
  },
  twitter: {
    cardType: 'summary_large_image',
    site: '@cross19xx',
    handle: '@cross19xx',
  },
};

const Cross19xx: React.FC<AppProps> = ({ Component, pageProps }) => (
  <>
    <Head>
      <meta
        name="viewport"
        content="width=device-width, height=device-height, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      />
    </Head>

    <DefaultSeo {...DEFAULT_SEO} />

    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  </>
);

export default Cross19xx;
