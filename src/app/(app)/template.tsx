import type { ReactNode } from "react";

// A template (unlike a layout) remounts on every navigation, which replays the fade.
export default function AppTemplate({ children }: { children: ReactNode }) {
  return <div className="page-fade">{children}</div>;
}
