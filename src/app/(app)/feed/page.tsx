import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = { title: "Feed" };

export default function FeedPage() {
  return <PagePlaceholder title="Feed" description="Small wins from people like you, newest first." />;
}
