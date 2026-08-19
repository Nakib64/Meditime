import dbConnect from "@/lib/mongodb";
import Hospital from "@/models/Hospital";
import mongoose from "mongoose";
import { Metadata } from "next";

export async function generateHospitalMetadata(
  slug: string,
  language: string = "en"
): Promise<Metadata> {
  try {
    await dbConnect();
    const decodedSlug = decodeURIComponent(slug);

    let hospital: any = null;
    if (mongoose.Types.ObjectId.isValid(decodedSlug)) {
      hospital = await Hospital.findById(decodedSlug)
        .populate({
          path: "thana",
          populate: { path: "district" },
        })
        .lean();
    } else {
      hospital = await Hospital.findOne({
        $or: [
          { slug: decodedSlug },
          { name: decodedSlug },
          { nameBn: decodedSlug },
        ],
      })
        .populate({
          path: "thana",
          populate: { path: "district" },
        })
        .lean();
    }

    if (!hospital) {
      return {
        title: "Hospital Details | Meditime",
        description: "View doctor list and hospital details on Meditime.",
      };
    }

    const hName =
      (language === "bn"
        ? hospital.nameBn || hospital.name
        : hospital.name || hospital.nameBn || "Hospital").trim();

    const address =
      language === "bn"
        ? hospital.addressBn || hospital.address
        : hospital.address || hospital.addressBn;

    const addressLocality =
      (language === "bn"
        ? hospital.thana?.nameBn || hospital.thana?.district?.nameBn
        : hospital.thana?.name || hospital.thana?.district?.name) ||
      (language === "bn" ? "সাভার" : "Savar");

    let title = "";
    let description = "";

    if (language === "bn") {
      title = `${hName} ডাক্তারের তালিকা | Meditime`;
      let addressPart = "";
      if (address) {
        const trimmed = address.trim();
        addressPart = trimmed.endsWith("।") || trimmed.endsWith(".") ? `${trimmed} ` : `${trimmed}। `;
      }
      description = `${hName}, ${addressPart}এটি ${addressLocality}-এর একটি হাসপাতাল। ডাক্তারের তালিকা, ডায়াগনস্টিক টেস্ট এবং আরও অনেক কিছু।`;
    } else {
      title = `${hName} Doctor List | Meditime`;
      let addressPart = "";
      if (address) {
        const trimmed = address.trim();
        addressPart = trimmed.endsWith(".") ? `${trimmed} ` : `${trimmed}. `;
      }
      description = `${hName}, ${addressPart}It is a Hospital in ${addressLocality}. Doctor List, Diagnostic Tests, and More`;
    }

    const hospitalSlug = hospital.slug || hospital._id;

    return {
      title,
      description,
      alternates: {
        canonical: `https://meditime.com.bd/hospital/${hospitalSlug}`,
      },
      openGraph: {
        title,
        description,
        images: ["/logo.png"],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: ["/logo.png"],
      },
    };
  } catch (error) {
    console.error("Hospital metadata generation error:", error);
    return {
      title: "Hospital Details | Meditime",
      description: "View doctor list and hospital details on Meditime.",
    };
  }
}
