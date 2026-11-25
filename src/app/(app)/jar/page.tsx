import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = { title: "My jar" };

export default function JarPage() {
  return <PagePlaceholder title="My jar" description="This month's lights, your shelf of past months and every win you've kept." />;
}
