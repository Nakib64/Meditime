import DoctorProfileClient from "./DoctorProfileClient";
import { Metadata, ResolvingMetadata } from "next";
import dbConnect from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import Hospital from "@/models/Hospital";
import { cookies } from "next/headers";

const getMedicalSpecialtyUrl = (specialty: string | undefined): string[] | string | undefined => {
  if (!specialty) return undefined;
  const specialtyMap: Record<string, string> = {
    "Gastro-Liver Diseases": "https://schema.org/Gastroenterologic",
    "Trauma & Orthopedic Surgery": "https://schema.org/Surgery",
    "Gynecology & Obstetrics": "https://schema.org/Gynecologic",
    "Neuro-Medicine & Surgery": "https://schema.org/Neurologic",
    "General & Laparoscopic Surgery": "https://schema.org/Surgery",
    "ENT (Ear, Nose & Throat)": "https://schema.org/Otolaryngologic",
    "Chest Diseases & Asthma": "https://schema.org/Pulmonologic",
    "Nephrology & Medicine": "https://schema.org/Renal",
    "Dermatology & Venereology": "https://schema.org/Dermatologic",
    "Neonatal & Pediatrics": "https://schema.org/Pediatric",
    "Cardiology & Medicine": "https://schema.org/Cardiovascular",
    "Medicine Specialist": "https://schema.org/InternalMedicine",
    "Ophthalmology": "https://schema.org/Ophthalmologic",
    "Oral & Dental Diseases": "https://schema.org/Dentistry",
    "Pain Medicine & Rheumatology": "https://schema.org/Rheumatologic",
    "Diabetes": "https://schema.org/Endocrine",
    "Physiotherapy": "https://schema.org/Physiotherapy",
    "Medicine & Diabetes": "https://schema.org/Endocrine",
    "Psychiatrist and psychotherapist": "https://schema.org/Psychiatric",
    "Urology & Nephrology": "https://schema.org/Urologic",
    "Thyroid & Hormone Specialist": "https://schema.org/Endocrine",
    "Nutrition & Dietetics": "https://schema.org/DietNutrition",
    "Burn, Plastic & Reconstructive Surgery": "https://schema.org/PlasticSurgery",
    "Chest/Thoracic Surgery": "https://schema.org/Surgery",
    "Oncology": "https://schema.org/Oncologic",
    "Hematology & Medicine": "https://schema.org/Hematologic",
    "Hepato-Biliary & Liver Transplant Surgery": "https://schema.org/Surgery",
    "Vascular Surgery": "https://schema.org/Surgery",
    "Food & Nutrition": "https://schema.org/DietNutrition",
    "Nuclear Medicine": "https://schema.org/MedicalSpecialty",
    "Cancer Specialist / Oncology": "https://schema.org/Oncologic"
  };
  const url = specialtyMap[specialty];
  return url ? [url] : specialty;
};

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    await dbConnect();

    const { id } = await params;
    const decodedId = decodeURIComponent(id);

    let query = {};

    // Check if Mongo ObjectId
    if (/^[0-9a-fA-F]{24}$/.test(decodedId)) {
      query = { _id: decodedId };
    } else {
      query = {
        slug: decodedId
      };
    }

    const doctor: any = await Doctor.findOne(query).lean();

    if (!doctor) {
      return {
        title: "Doctor Profile | Meditime",
        description:
          "View doctor profile and book appointments on Meditime.",
      };
    }

    const cookieStore = await cookies();

    const language =
      cookieStore.get("meditime-language")?.value || "en";

    // Language-aware fields
    const docName =
      language === "bn"
        ? doctor.nameBn || doctor.name
        : doctor.name || doctor.nameBn;

    const docSpecialty =
      language === "bn"
        ? doctor.specialtyBn || doctor.specialty
        : doctor.specialty || doctor.specialtyBn;

    const docDistrict =
      language === "bn"
        ? doctor.districtBn || doctor.district
        : doctor.district || doctor.districtBn || "Dhaka";

    const hospitalName =
      language === "bn"
        ? doctor.hospitalBn || doctor.hospital
        : doctor.hospital || doctor.hospitalBn || "reputed hospital";

    const title =
      language === "bn"
        ? `${docName} - ${docSpecialty} | Meditime`
        : `${docName} - ${docSpecialty} in ${docDistrict} | Meditime`;

    const description =
      language === "bn"
        ? `${hospitalName}-এ ${docSpecialty} বিশেষজ্ঞ ${docName}-এর অ্যাপয়েন্টমেন্ট বুক করুন।`
        : `Book an appointment with ${docName}, ${docSpecialty} specialist at ${hospitalName}.`;

    return {
      title,

      description,

      alternates: {
        canonical: `https://meditime.com.bd/doctors/${doctor.slug ||
          doctor._id
          }`,
      },

      openGraph: {
        title,
        description,
        type: "profile",
        images: [
          {
            url: doctor.image || "/logo.png",
          },
        ],
      },

      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [doctor.image || "/logo.png"],
      },
    };
  } catch (error) {
    console.error("Metadata generation error:", error);

    return {
      title: "Doctor Profile | Meditime",
      description:
        "View doctor profile and book appointments on Meditime.",
    };
  }
}

async function getDoctorSchemaData(id: string) {
  try {
    await dbConnect();
    const decodedId = decodeURIComponent(id);
    const query = /^[0-9a-fA-F]{24}$/.test(decodedId)
      ? { _id: decodedId }
      : { slug: decodedId };

    const [doctor, hospitals] = await Promise.all([
      Doctor.findOne(query).lean() as any,
      Hospital.find({}, { name: 1, slug: 1 }).lean(),
    ]);
    return { doctor, hospitals };
  } catch {
    return { doctor: null, hospitals: [] };
  }
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { doctor, hospitals } = await getDoctorSchemaData(id);

  let jsonLd: object | null = null;

  if (doctor) {
    const baseUrl = "https://meditime.com.bd";
    const doctorUrl = `${baseUrl}/doctor/${(doctor as any).slug || (doctor as any)._id}`;
    const availabilityArray: any[] = Array.isArray((doctor as any).availability)
      ? (doctor as any).availability
      : [(doctor as any).availability].filter(Boolean);
    const fees = [(doctor as any).newPatientFee, (doctor as any).reportShowFee].filter(
      (f) => f !== undefined && f !== null && f > 0
    ) as number[];
    const minFee = fees.length > 0 ? Math.min(...fees) : undefined;

    jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${baseUrl}/#organization`,
          "name": "Meditime",
          "url": baseUrl,
          "logo": { "@type": "ImageObject", "url": `${baseUrl}/logo.png` },
        },
        {
          "@type": "WebSite",
          "@id": `${baseUrl}/#website`,
          "url": baseUrl,
          "name": "Meditime",
          "publisher": { "@id": `${baseUrl}/#organization` },
        },
        {
          "@type": "WebPage",
          "@id": `${doctorUrl}#webpage`,
          "url": doctorUrl,
          "name": (doctor as any).name,
          "isPartOf": { "@id": `${baseUrl}/#website` },
        },
        {
          "@type": "Physician",
          "@id": `${doctorUrl}#physician`,
          "name": (doctor as any).name,
          "image": (doctor as any).image || `${baseUrl}/logo.png`,
          "description": (doctor as any).bio || `${(doctor as any).name} - ${(doctor as any).specialty}`,
          "url": doctorUrl,
          "medicalSpecialty": getMedicalSpecialtyUrl((doctor as any).specialty),
          "telephone": "+8801946102102",
          ...(minFee ? { "priceRange": `৳${minFee}` } : {}),
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Savar",
            "addressRegion": "Dhaka",
            "addressCountry": "BD",
          },
          ...((doctor as any).rating
            ? {
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": (doctor as any).rating,
                "reviewCount": "10",
                "bestRating": "5",
                "worstRating": "1",
              },
            }
            : {}),
          "worksFor": availabilityArray.map((slot) => {
            const hospSlug = slot?.hospital;
            const hospName =
              (hospitals as any[]).find(
                (h: any) => h.slug === hospSlug || h.name === hospSlug
              )?.name ||
              hospSlug ||
              "Medical Organization";
            return { "@type": "MedicalOrganization", "name": hospName };
          }),
          "openingHoursSpecification": availabilityArray.flatMap((slot) =>
            (slot?.days || []).map((day: string) => {
              const timeParts = (slot?.time || "09:00 - 17:00").split(" - ");
              return {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": day,
                "opens": timeParts[0] || "09:00",
                "closes": timeParts[1] || "17:00",
              };
            })
          ),
        },
        {
          "@type": "BreadcrumbList",
          "@id": `${doctorUrl}#breadcrumb`,
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
            { "@type": "ListItem", "position": 2, "name": "Doctors", "item": `${baseUrl}/doctor` },
            { "@type": "ListItem", "position": 3, "name": (doctor as any).name, "item": doctorUrl },
          ],
        },
        {
          "@type": "FAQPage",
          "@id": `${doctorUrl}#faq`,
          "mainEntity": [
            {
              "@type": "Question",
              "name": `How to get appointment with ${(doctor as any).name}?`,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `You can book an appointment with ${(doctor as any).name} online via Meditime.`,
              },
            },
            {
              "@type": "Question",
              "name": `Where does ${(doctor as any).name} practice?`,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `${(doctor as any).name} practices at ${availabilityArray
                  .map((slot) => {
                    const hospSlug = slot?.hospital;
                    return (
                      (hospitals as any[]).find(
                        (h: any) => h.slug === hospSlug || h.name === hospSlug
                      )?.name || hospSlug
                    );
                  })
                  .filter(Boolean)
                  .join(", ")}.`,
              },
            },
          ],
        },
      ],
    };
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <DoctorProfileClient />
    </>
  );
}
