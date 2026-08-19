import dbConnect from "@/lib/mongodb";
import Doctor from "@/models/Doctor";
import Hospital from "@/models/Hospital";
import Thana from "@/models/Thana";
import District from "@/models/District";
import { Metadata } from "next";

export async function generateDoctorMetadata(
  id: string,
  language: string = "en"
): Promise<Metadata> {
  try {
    await dbConnect();
    // Touch models to register schemas if needed
    if (!Thana || !District) { /* no-op */ }

    const decodedId = decodeURIComponent(id);
    let query: any = {};
    if (/^[0-9a-fA-F]{24}$/.test(decodedId)) {
      query = { _id: decodedId };
    } else {
      query = {
        $or: [{ slug: decodedId }, { slugBn: decodedId }]
      };
    }

    const doctor: any = await Doctor.findOne(query).lean();

    if (!doctor) {
      return {
        title: "Doctor Profile | Meditime",
        description: "View doctor profile and book appointments on Meditime.",
      };
    }

    // 1. Gather all hospital slugs from doctor availability slots & doctor.hospital
    const availabilityArray = Array.isArray(doctor.availability)
      ? doctor.availability
      : [doctor.availability].filter(Boolean);

    const hospitalSlugs: string[] = [];
    if (doctor.hospital) hospitalSlugs.push(doctor.hospital);
    availabilityArray.forEach((slot: any) => {
      if (slot?.hospital && !hospitalSlugs.includes(slot.hospital)) {
        hospitalSlugs.push(slot.hospital);
      }
    });

    // 2. Fetch associated hospital documents from DB with thana & district populated
    let hospitalDocs: any[] = [];
    if (hospitalSlugs.length > 0) {
      hospitalDocs = await Hospital.find({
        $or: [{ slug: { $in: hospitalSlugs } }, { name: { $in: hospitalSlugs } }]
      })
        .populate({
          path: "thana",
          populate: { path: "district" }
        })
        .lean();
    }

    // Helper to extract hospital details
    const findHospitalDoc = (slugOrName: string) =>
      hospitalDocs.find((h) => h.slug === slugOrName || h.name === slugOrName);

    // 3. Resolve target hospital & area following Priority Rule:
    // Priority: Savar location in availability slots; if not available, use first slot's hospital location.
    let selectedHospitalDoc: any = null;
    let selectedAreaEn = "";
    let selectedAreaBn = "";

    // Check availability slots for Savar priority
    for (const slot of availabilityArray) {
      const hDoc = findHospitalDoc(slot?.hospital);
      if (hDoc) {
        const thanaName = hDoc.thana?.name || "";
        const districtName = hDoc.thana?.district?.name || "";
        const address = hDoc.address || "";
        const hName = hDoc.name || "";

        const isSavar =
          /savar/i.test(thanaName) ||
          /savar/i.test(districtName) ||
          /savar/i.test(address) ||
          /savar/i.test(hName) ||
          /সাভার/.test(hDoc.thana?.nameBn || "") ||
          /সাভার/.test(hDoc.addressBn || "");

        if (isSavar) {
          selectedHospitalDoc = hDoc;
          selectedAreaEn = "Savar";
          selectedAreaBn = "সাভার";
          break; // Found Savar priority!
        }
      }
    }

    // If Savar not found in any slot, fall back to first slot's hospital location
    if (!selectedHospitalDoc && availabilityArray.length > 0) {
      const firstSlotSlug = availabilityArray[0]?.hospital;
      const hDoc = findHospitalDoc(firstSlotSlug);
      if (hDoc) {
        selectedHospitalDoc = hDoc;
        selectedAreaEn =
          hDoc.thana?.name || hDoc.thana?.district?.name || doctor.district || "Savar";
        selectedAreaBn =
          hDoc.thana?.nameBn || hDoc.thana?.district?.nameBn || doctor.districtBn || "সাভার";
      }
    }

    // Fallback if no slot hospital found
    if (!selectedHospitalDoc && hospitalDocs.length > 0) {
      selectedHospitalDoc = hospitalDocs[0];
    }

    // Format Area
    const area =
      language === "bn"
        ? selectedAreaBn || (selectedHospitalDoc?.thana?.nameBn || selectedHospitalDoc?.thana?.district?.nameBn || doctor.districtBn || "সাভার")
        : selectedAreaEn || (selectedHospitalDoc?.thana?.name || selectedHospitalDoc?.thana?.district?.name || doctor.district || "Savar");

    // Format Doctor Name
    const rawName =
      language === "bn"
        ? doctor.nameBn || doctor.name || "ডাক্তার"
        : doctor.name || doctor.nameBn || "Doctor";

    let formattedName = rawName.trim();
    if (language === "bn") {
      const desig = doctor.designationBn || doctor.designation;
      if (desig && !formattedName.startsWith(desig) && !formattedName.includes(desig)) {
        formattedName = `${desig} ${formattedName}`;
      }
      if (!formattedName.startsWith("ডাঃ") && !formattedName.startsWith("ডাক্তার")) {
        formattedName = `ডাঃ ${formattedName}`;
      }
    } else {
      const desig = doctor.designation;
      if (desig && !formattedName.toLowerCase().startsWith(desig.toLowerCase()) && !formattedName.toLowerCase().includes(desig.toLowerCase())) {
        formattedName = `${desig} ${formattedName}`;
      }
      if (
        !/^Dr\.?\s+/i.test(formattedName) &&
        !/^Prof/i.test(formattedName) &&
        !/^Assistant/i.test(formattedName) &&
        !/^Associate/i.test(formattedName)
      ) {
        formattedName = `Dr. ${formattedName}`;
      }
    }

    // Format Hospital Name
    const rawHospitalName =
      (language === "bn"
        ? selectedHospitalDoc?.nameBn || selectedHospitalDoc?.name
        : selectedHospitalDoc?.name) ||
      (language === "bn" ? doctor.hospitalBn || doctor.hospital : doctor.hospital);

    const hospitalName = rawHospitalName ? rawHospitalName.trim() : "";

    // Format Doctor Department / Specialty
    const rawDept =
      language === "bn"
        ? doctor.departmentBn || doctor.specialtyBn || doctor.department || doctor.specialty
        : doctor.department || doctor.specialty || doctor.departmentBn || doctor.specialtyBn;

    let docDeptName = (rawDept || (language === "bn" ? "বিশেষজ্ঞ" : "Specialist")).trim();
    if (language !== "bn") {
      if (!/specialist/i.test(docDeptName) && !/doctor/i.test(docDeptName)) {
        docDeptName = `${docDeptName} Specialist`;
      }
    }

    const docSpecialty =
      language === "bn"
        ? doctor.specialtyBn || doctor.specialty || "বিশেষজ্ঞ"
        : doctor.specialty || doctor.specialtyBn || "Specialist";

    const doctorName = (
      language === "bn"
        ? doctor.nameBn || doctor.name
        : doctor.name || doctor.nameBn || ""
    ).trim();

    // Meta Title & Description Frames
    const title =
      language === "bn"
        ? `${docDeptName} ${doctorName} - ${area}-এ আপনার নিকটস্থ। চেম্বারের সময়সূচী, ফি দেখুন এবং ডাক্তারের অ্যাপয়েন্টমেন্ট বুক করুন।`
        : `${docDeptName} ${doctorName} - Near You in ${area}. See Chamber Time, Fees, and Book Doctor Appoinrment.`;

    const description =
      language === "bn"
        ? `${docDeptName} ${doctorName} - ${area}-এ আপনার নিকটস্থ। চেম্বারের সময়সূচী, ফি দেখুন এবং ডাক্তারের অ্যাপয়েন্টমেন্ট বুক করুন।`
        : `${docDeptName} ${doctorName} - Near You in ${area}. See Chamber Time, Fees, and Book Doctor Appoinrment.`;

    const doctorSlug = doctor.slug || doctor._id;

    return {
      title,
      description,
      alternates: {
        canonical: `https://meditime.com.bd/doctor/${doctorSlug}`,
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
    console.error("Doctor metadata generation error:", error);
    return {
      title: "Doctor Profile | Meditime",
      description: "View doctor profile and book appointments on Meditime.",
    };
  }
}
