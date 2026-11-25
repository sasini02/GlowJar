import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = { title: "Add a win" };

export default function NewWinPage() {
  return <PagePlaceholder title="Add a win" description="What went right today, however small?" />;
}
