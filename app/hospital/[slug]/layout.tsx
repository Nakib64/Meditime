import { Metadata } from "next";
import { generateHospitalMetadata } from "@/lib/hospital-metadata";
import { cookies } from "next/headers";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> | { slug: string } }
): Promise<Metadata> {
  const resolvedParams = await params;
  const cookieStore = await cookies();
  const language = cookieStore.get("meditime-language")?.value || "en";
  return generateHospitalMetadata(resolvedParams.slug, language);
}

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
