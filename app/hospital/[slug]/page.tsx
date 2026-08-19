import HospitalDetailClient from "./HospitalDetailClient";
import { Metadata } from "next";
import dbConnect from "@/lib/mongodb";
import Hospital from "@/models/Hospital";
import mongoose from "mongoose";
import { cookies } from "next/headers";
import { generateHospitalMetadata } from "@/lib/hospital-metadata";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const cookieStore = await cookies();
  const language = cookieStore.get("meditime-language")?.value || "en";
  return generateHospitalMetadata(slug, language);
}

async function getHospitalSchemaData(slug: string) {
  try {
    await dbConnect();
    const decodedSlug = decodeURIComponent(slug);

    let hospital: any = null;
    if (mongoose.Types.ObjectId.isValid(decodedSlug)) {
      hospital = await Hospital.findById(decodedSlug)
        .populate({ path: 'thana', populate: { path: 'district', populate: { path: 'division' } } })
        .lean();
    } else {
      hospital = await Hospital.findOne({
        $or: [{ slug: decodedSlug }, { name: decodedSlug }, { nameBn: decodedSlug }],
      })
        .populate({ path: 'thana', populate: { path: 'district', populate: { path: 'division' } } })
        .lean();
    }
    return { hospital };
  } catch {
    return { hospital: null };
  }
}

export default async function HospitalDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { hospital } = await getHospitalSchemaData(slug);

  const baseUrl = 'https://meditime.com.bd';
  let hospitalSchema: object | null = null;
  let breadcrumbSchema: object | null = null;

  if (hospital) {
    const hospitalUrl = `${baseUrl}/hospital/${(hospital as any).slug || encodeURIComponent((hospital as any).name)}`;

    hospitalSchema = {
      '@context': 'https://schema.org',
      '@type': 'Hospital',
      'name': (hospital as any).name,
      'url': hospitalUrl,
      'telephone': (hospital as any).phone || undefined,
      'address': {
        '@type': 'PostalAddress',
        'streetAddress': (hospital as any).address || '',
        'addressLocality': (hospital as any).thana?.name || '',
        'addressRegion': (hospital as any).thana?.district?.name || 'Dhaka',
        'addressCountry': 'BD',
      },
      'openingHours': 'Mo-Su 00:00-24:00',
    };

    breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home',      'item': baseUrl },
        { '@type': 'ListItem', 'position': 2, 'name': 'Hospitals', 'item': `${baseUrl}/hospital` },
        { '@type': 'ListItem', 'position': 3, 'name': (hospital as any).name, 'item': hospitalUrl },
      ],
    };
  }

  return (
    <>
      {hospitalSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(hospitalSchema) }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
        />
      )}
      <HospitalDetailClient />
    </>
  );
}