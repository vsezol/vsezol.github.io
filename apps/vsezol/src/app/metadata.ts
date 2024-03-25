import { Metadata } from 'next';

const title = 'Vsevolod Zolotov';
const description =
  'Tech Lead Software Engineer focusing on responsive and high-availability applications';
const email = 'vsezold@gmail.com';

const sitePreviewImages = [
  {
    type: 'jpeg',
    url: 'site-preview-512x512.jpeg',
    width: 512,
    height: 512,
  },
  {
    type: 'jpeg',
    url: 'site-preview-192x192.jpeg',
    width: 192,
    height: 192,
  },
];

// TODO change
export const metadata: Metadata = {
  title,
  description,
  applicationName: title,
  metadataBase: new URL('https://vsezol.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
      'ru-RU': '/ru-RU',
    },
  },
  authors: {
    name: 'Vsevolod Zolotov',
    url: email,
  },
  openGraph: {
    title,
    description,
    emails: email,
    siteName: 'vsezol',
    images: sitePreviewImages,
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: sitePreviewImages,
  },
  appleWebApp: {
    capable: true,
    title: 'string',
    startupImage: 'apple-touch-icon.png',
  },
  icons: [
    { rel: 'icon', url: 'favicon-16x16.png', sizes: '16x16', type: 'png' },
    { rel: 'icon', url: 'favicon-32x32.png', sizes: '32x32', type: 'png' },
    {
      rel: 'icon',
      url: 'android-chrome-192x192.png',
      sizes: '192x192',
      type: 'png',
    },
    {
      rel: 'icon',
      url: 'android-chrome-512x512.png',
      sizes: '512x512',
      type: 'png',
    },
    { rel: 'apple-touch-icon', url: 'apple-touch-icon.png', type: 'png' },
  ],
  keywords: [
    'software',
    'development',
    'programming',
    'engineer',
    'code',
    'vsezol',
    'vsezold',
    'vsevolod',
    'zolotov',
    'web',
    'frontend',
    'backend',
    'full-stack',
    'mentor',
    'teacher',
    'react',
    'angular',
    'javascript',
  ],
};
