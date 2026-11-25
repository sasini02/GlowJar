import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return <PagePlaceholder title="Notifications" description="Gentle news from your jar will show up here." />;
}
