import DoctorListPageClient from './DoctorListPageClient';
import { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Department from '@/models/Department';
import Hospital from '@/models/Hospital';

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

export const metadata: Metadata = {
  title: "Doctors Near You in Savar | Meditime",
  description: "Meditime Doctor List - 1000+ Doctors in Savar in one place - Medicine doctor, Diabetes Specialists, Surgeons, Orthopedic Doctor, Gynecologist, Cardiologist",
};

async function getSchemaData() {
  try {
    await dbConnect();
    const [totalCount, doctors] = await Promise.all([
      Doctor.countDocuments(),
      Doctor.find({}, { name: 1, nameBn: 1, slug: 1, specialty: 1 })
        .sort({ createdAt: -1 })
        .limit(12)
        .lean(),
    ]);
    return { totalCount, doctors };
  } catch {
    return { totalCount: 0, doctors: [] };
  }
}

export default async function DoctorListPage() {
  const { totalCount, doctors } = await getSchemaData();

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": "Find Doctors in Savar, Dhaka",
    "url": "https://meditime.com.bd/doctor",
    "description": "Browse and book appointments with top verified doctors in Savar, Dhaka.",
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": totalCount,
      "itemListElement": (doctors as any[]).map((doctor, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Physician",
          "name": doctor.name || doctor.nameBn || "",
          "url": `https://meditime.com.bd/doctor/${doctor.slug || doctor._id}`,
          "medicalSpecialty": getMedicalSpecialtyUrl(doctor.specialty),
        }
      }))
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home",    "item": "https://meditime.com.bd" },
      { "@type": "ListItem", "position": 2, "name": "Doctors", "item": "https://meditime.com.bd/doctor" }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <DoctorListPageClient />
    </>
  );
}
