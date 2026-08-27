import type { Metadata } from "next";
import { LegalDoc } from "@/components/LegalDoc";

export const metadata: Metadata = { title: "이용약관 · Candour" };

export default function TermsPage() {
  return <LegalDoc kind="terms" title="이용약관" />;
}
