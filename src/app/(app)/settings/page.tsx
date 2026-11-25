import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/ui/page-placeholder";

export const metadata: Metadata = { title: "You" };

export default function SettingsPage() {
  return <PagePlaceholder title="You" description="Your username, reminders, quiet hours and data." />;
}
