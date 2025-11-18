import type { ReactNode } from "react";

import "@schemavaults/theme/globals.css";
import { Toaster } from "@schemavaults/ui";
import type { Metadata } from "next";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: "Invoice Hours Counter",
  description:
    "A tool to calculate invoice hours directly from your iCalendar data!",
};
