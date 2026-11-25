import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = { title: "Letters" };

export default function LettersPage() {
  return <PagePlaceholder title="Letters" description="Notes to your future self, sealed until the day you choose." />;
}
