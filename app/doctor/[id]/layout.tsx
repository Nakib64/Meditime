import { Metadata } from "next";
import { generateDoctorMetadata } from "@/lib/doctor-metadata";
import { cookies } from "next/headers";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const resolvedParams = await params;
  const cookieStore = await cookies();
  const language = cookieStore.get("meditime-language")?.value || "en";
  return generateDoctorMetadata(resolvedParams.id, language);
}

export default function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}