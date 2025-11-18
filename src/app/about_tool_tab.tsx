"use client";

import { cn, TabsContent } from "@schemavaults/ui";
import type { ReactElement } from "react";
import Image from "next/image";

interface InstructionalImage {
  actualX: number;
  actualY: number;
  title: string;
  description: string;
  src: string;
}

const instructions: InstructionalImage[] = [
  {
    title: "1. Example Calendar",
    description:
      "This is an example calendar showing how you might have a 'work calendar' with events for multiple different projects.",
    actualX: 3024,
    actualY: 1964,
    src: "/instructions/example_calendar.png",
  },
  {
    title: "2. Export your calendar",
    description:
      "In iCalendar, you can press 'File' > 'Export' > 'Export' to export the selected calendar to .ics format.",
    actualX: 3024,
    actualY: 1964,
    src: "/instructions/how_to_export_icalendar.png",
  },
  {
    title: "3. Save your calendar somewhere",
    description:
      "Save your .ics calendar export somewhere, such as your desktop or cloud storage.",
    actualX: 868,
    actualY: 348,
    src: "/instructions/example_export_location.png",
  },
  {
    title: "4. Upload your .ics file and apply filters",
    description:
      "Navigate to the 'upload your calendar' / 'upload' tab from the navigation bar at the top of this webpage. Upload your .ics file, apply any desired filters, and click 'Parse Calendar Events'! A table will be generated summarizing your hours on the project.",
    actualX: 868,
    actualY: 348,
    src: "/instructions/using_the_tool.png",
  },
];

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
      <ol className="list-none flex flex-col w-full gap-4 items-stretch justify-start">
        {instructions.map((image) => (
          <li
            key={image.title}
            className={cn(
              "flex flex-col justify-start items-start gap-1",
              "p-2",
              "border border-dotted rounded-md border-gray-300",
            )}
          >
            <h3 className="text-lg font-semibold">{image.title}</h3>
            <p>{image.description}</p>
            <Image
              src={image.src}
              alt={image.title}
              width={image.actualX}
              height={image.actualY}
              className="mt-4"
            />
          </li>
        ))}
      </ol>
    </TabsContent>
  );
}
