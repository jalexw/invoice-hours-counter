"use client";

import summarizeHours, {
  type ISummaryGenerationResult,
} from "@/summarizeHours";
import type { ParsedIcsData } from "@jalexw/calendar-ics-parser";
import { type ReactElement, useMemo } from "react";
import useFilterInputsStore from "./useFilterInputsStore";
import type { IFilterOptions } from "@/filterEvents";
import {
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
            <TableHead>Description</TableHead>
            <TableHead>Hours</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {summary.events.map((event) => (
            <TableRow key={event.id}>
              <TableCell>{event.description}</TableCell>
              <TableCell>{event.durationHours}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell>{summary.sum}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      <div className="flex flex-col items-center justify-start gap-4">
        <p>
          Did this save you some time? Feel free to buy me a coffee at the
          following link:
        </p>
        <a href="https://buymeacoffee.com/jalexw">
          <Image
            src="./public/buymeacoffee.gif"
            alt="Buy me a coffee"
            width={300}
            height={300}
          />
        </a>
      </div>
    </div>
  );
}
