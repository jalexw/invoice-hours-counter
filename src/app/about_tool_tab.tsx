"use client";

import { TabsContent } from "@schemavaults/ui";
import type { ReactElement } from "react";

export default function AboutToolTab(): ReactElement {
  return (
    <TabsContent value="about" className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">About this tool:</h2>
      <p>
        This is a tool to help you calculate the number of hours you worked on a
        project from an iCalendar file export.
      </p>
      <p>
        Click 'upload your calendar' in the navigation bar to upload your
        calendar file, if you already know how to use this tool. Otherwise, see
        below for an example!
      </p>
    </TabsContent>
  );
}
