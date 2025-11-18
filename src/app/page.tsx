"use client";

import { useState, type ReactElement } from "react";
import { cn, Tabs, TabsList, TabsContent, TabsTrigger } from "@schemavaults/ui";
import type { ParsedIcsData } from "@jalexw/calendar-ics-parser";
import IcsAndFiltersInputsForm from "./ics-and-filters-input-form";
import AboutToolTab from "./about_tool_tab";
import HoursSummarySection from "./hours-summary-section";
import github_url from "./github_url";

export default function Page(): ReactElement {
  const [parsedIcs, setParsedIcs] = useState<ParsedIcsData | undefined>(
    undefined,
  );

  return (
    <div className={cn("w-screen min-h-screen", "overflow-x-hidden")}>
      <Tabs defaultValue="about" className="w-full h-full grow flex flex-col">
        <nav
          className={cn(
            "w-full h-24",
            "flex flex-row flex-nowrap items-center justify-start gap-4",
            "p-4",
            "border-b border-gray-400",
            "shadow-md",
          )}
        >
          <h1 className="font-bold text-2xl text-black">
            <a href={github_url} target="_blank" rel="noopener noreferrer">
              @jalexw/invoice-hours-counter
            </a>
          </h1>
          <TabsList>
            <TabsTrigger value="about">About this tool</TabsTrigger>
            <TabsTrigger value="upload_your_calendar">
              Upload your calendar
            </TabsTrigger>
          </TabsList>
        </nav>
        <div className="w-full grow p-4">
          <AboutToolTab />
          <TabsContent
            value="upload_your_calendar"
            className={cn(
              "w-full",
              "flex flex-col items-center justify-start gap-4",
            )}
          >
            <h2 className="text-xl font-semibold">
              Upload your calendar to summarize hours:
            </h2>
            <IcsAndFiltersInputsForm setParsedIcs={setParsedIcs} />
            {parsedIcs && <HoursSummarySection icsData={parsedIcs} />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
