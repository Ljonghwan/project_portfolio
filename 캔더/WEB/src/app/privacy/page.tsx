import type { Metadata } from "next";
import { LegalDoc } from "@/components/LegalDoc";

export const metadata: Metadata = { title: "개인정보처리방침 · Candour" };

export default function PrivacyPage() {
  return <LegalDoc kind="privacy" title="개인정보처리방침" />;
}
