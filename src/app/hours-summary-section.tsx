"use client";

import summarizeHours, {
  type ISummaryGenerationResult,
} from "@/summarizeHours";
import type { ParsedIcsData } from "@jalexw/calendar-ics-parser";
import { type ReactElement, useMemo } from "react";
import useFilterInputsStore from "./useFilterInputsStore";
import type { IFilterOptions } from "@/filterEvents";
import {
  Button,
  cn,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@schemavaults/ui";
import Image from "next/image";
import { Table as TableIcon } from "lucide-react";
import generateCsvFromSummary from "@/generateCsvFromSummary";

export interface ISummaryProps {
  icsData: ParsedIcsData;
}

export default function HoursSummarySection({
  icsData,
}: ISummaryProps): ReactElement {
  const { after, project } = useFilterInputsStore();
  const filters: IFilterOptions = useMemo(() => {
    return {
      after,
      project,
    };
  }, [after, project]);
  const summary: ISummaryGenerationResult = useMemo(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("Generating summary with filters:", filters);
    }
    return summarizeHours({
      data: icsData,
      log:
        process.env.NODE_ENV === "development"
          ? console.log
          : (inputs: unknown[]) => {
              /** No-op, don't log to console in production */
            },
      filters,
    });
  }, [icsData, filters]);

  return (
    <div
      className={cn("flex flex-col items-center justify-start gap-4", "pb-64")}
    >
      <h2 className="text-xl font-semibold">Summarized hours:</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summary.events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>{event.startTime.toDateString()}</TableCell>
              <TableCell>{event.description}</TableCell>
              <TableCell>{event.durationHours.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2} className="text-center">
              Total Hours
            </TableCell>
            <TableCell>{summary.sum.toFixed(2)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <Button
        onClick={(e): void => {
          e.preventDefault();
          const csv: string = generateCsvFromSummary(summary);
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "invoice_hours.csv";
          a.click();
        }}
        className="flex flex-row flex-nowrap gap-2"
      >
        <TableIcon className="h-4 w-4" /> Download table as CSV
      </Button>
      <div className="flex flex-col items-center justify-start gap-4">
        <p>
          Did this tool save you some time? Feel free to buy me a coffee at the
          following link:
        </p>
        <a href="https://buymeacoffee.com/jalexw">
          <Image
            src="/buymeacoffee.gif"
            alt="Buy me a coffee"
            width={500}
            height={500}
            unoptimized
          />
        </a>
      </div>
    </div>
  );
}
