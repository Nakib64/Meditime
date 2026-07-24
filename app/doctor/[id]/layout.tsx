import { Metadata } from "next";
import dbConnect from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import Hospital from "@/models/Hospital";

async function getDoctorData(slug: string) {
  try {
    await dbConnect();

    const decodedSlug = decodeURIComponent(slug);

    // Find by English slug
    let doctor = await Doctor.findOne({
      slug: decodedSlug,
    });

    // Find by Bangla slug
    if (!doctor) {
      doctor = await Doctor.findOne({
        slugBn: decodedSlug,
      });
    }

    // Fallback to Mongo ID
    if (!doctor) {
      try {
        doctor = await Doctor.findById(decodedSlug);
      } catch (error) {
        console.error("Invalid doctor ID");
      }
    }

    if (!doctor) {
      return null;
    }

    // Fetch hospital separately
    if (doctor.hospital) {
      const hospitalDoc = await Hospital.findOne({
        name: doctor.hospital,
      }).populate({
        path: "thana",
        populate: {
          path: "district",
        },
      });

      // attach manually
      (doctor as any).hospitalDetails = hospitalDoc;
    }

    return doctor;
  } catch (error) {
    console.error("Error fetching doctor for metadata:", error);
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {

  const resolvedParams = await params;

  const doctor = await getDoctorData(resolvedParams.id);

  if (!doctor) {
    return {
      title: "Doctor Profile | Meditime",
      description:
        "View doctor profile and book appointments on Meditime.",
    };
  }

  const name =
    doctor.name ||
    doctor.nameBn ||
    "Unknown Doctor";

  const specialty =
    doctor.specialty ||
    doctor.specialtyBn ||
    "Specialist";

  const hospital =
    doctor.hospital ||
    doctor.hospitalBn ||
    "Unknown Hospital";

  const location =
    (doctor as any)?.hospitalDetails?.thana?.district?.name ||
    doctor.district ||
    "Dhaka";

  const title = `${name} - ${specialty} in ${location} | Meditime`;

  const description = `Book an appointment with ${name}, ${specialty} specialist at ${hospital}. সহজে অনলাইনে সিরিয়াল বুক করুন Meditime-এ।`;

  return {
    title,

    description: description.substring(0, 155),

    alternates: {
      canonical: `https://meditime.com.bd/doctor/${doctor.slug ||
        doctor.slugBn ||
        doctor._id
        }`,
    },

    openGraph: {
      title,
      description,
      images: [doctor.image || "/logo.png"],
      type: "profile",
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [doctor.image || "/logo.png"],
    },
  };
}

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}