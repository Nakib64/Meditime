import HospitalListClient from './HospitalListClient';
import Script from 'next/script';
import { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import Hospital from '@/models/Hospital';

export const metadata: Metadata = {
  title: 'Hospitals Near You in Savar | Meditime',
  description: 'Enam Medical College Doctor List, Savar Popular Hospital Doctor List, Ibn Sina Diagnostic Center Savar Doctor List, and Doctor Lists Top Hospitals in Savar',
};

async function getHospitalSchemaData() {
  try {
    await dbConnect();
    const [total, hospitals] = await Promise.all([
      Hospital.countDocuments(),
      Hospital.find({}, { name: 1, slug: 1 }).sort({ name: 1 }).limit(20).lean(),
    ]);
    return { total, hospitals };
  } catch {
    return { total: 0, hospitals: [] };
  }
}

export default async function HospitalListPage() {
  const { total, hospitals } = await getHospitalSchemaData();

  const baseUrl = 'https://meditime.com.bd';

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'Hospitals & Clinics | Meditime',
    'url': `${baseUrl}/hospital`,
    'description': 'Explore top hospitals and clinics listed on Meditime.',
    'mainEntity': {
      '@type': 'ItemList',
      'numberOfItems': total,
      'itemListElement': (hospitals as any[]).map((h, i) => ({
        '@type': 'ListItem',
        'position': i + 1,
        'item': {
          '@type': 'Hospital',
          'name': h.name,
          'url': `${baseUrl}/hospital/${h.slug || encodeURIComponent(h.name)}`,
        },
      })),
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home',      'item': baseUrl },
      { '@type': 'ListItem', 'position': 2, 'name': 'Hospitals', 'item': `${baseUrl}/hospital` },
    ],
  };

  return (
    <>
      <Script src="https://www.googletagmanager.com/gtag/js?id=G-YPCJ8FPZNM" strategy="afterInteractive" />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-YPCJ8FPZNM');
        `}
      </Script>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <HospitalListClient />
    </>
  );
}
