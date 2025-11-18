"use client";

import { ParsedIcsData } from "@jalexw/calendar-ics-parser";
import {
  Button,
  cn,
  FileInput,
  Input,
  Label,
  useToast,
} from "@schemavaults/ui";
import { Calendar } from "lucide-react";
import { type ReactElement, useCallback, useState, useTransition } from "react";
import useFilterInputsStore from "./useFilterInputsStore";

export interface IcsAndFiltersInputsFormProps {
  setParsedIcs: (parsed: ParsedIcsData) => void;
}

function IcsAndFiltersInputsForm({
  setParsedIcs,
}: IcsAndFiltersInputsFormProps): ReactElement {
  const debug: boolean = process.env.NODE_ENV === "development";
  const { project, setProject, after, setAfterDate } = useFilterInputsStore();
  const [icsFile, setIcsFile] = useState<string | undefined>(undefined);
  const [parsing, startParsing] = useTransition();
  const { toast } = useToast();
  const onClickParseIcsFile = useCallback(() => {
    if (typeof icsFile !== "string" || icsFile.length === 0) {
      toast({
        variant: "destructive",
        title: "Failed to load .ics file from state!",
      });
      return;
    }
    startParsing(async () => {
      try {
        const parseIcsData = await import(
          "@jalexw/calendar-ics-parser/parseIcsData"
        ).then((mod) => mod.default);
        const parsed: ParsedIcsData = await parseIcsData(
          icsFile satisfies string,
          debug,
        );
        setParsedIcs(parsed);
      } catch (e: unknown) {
        console.error(
          "Error parsing .ics file with @jalexw/calendar-ics-parser: ",
          e,
        );
        toast({
          variant: "destructive",
          title: "Error parsing .ics file with @jalexw/calendar-ics-parser!",
          description:
            e instanceof Error ? e.message : "An unknown error has occurred!",
        });
        return;
      }
    });
  }, [icsFile, setIcsFile, startParsing, setParsedIcs, toast]);

  const inputContainerClassname = cn("flex flex-row flex-nowrap gap-2 w-full");

  return (
    <div
      className={cn(
        "w-full",
        "max-w-[400px] md:max-w-[600px] lg:max-w-[600px] xl:max-w-[800px]",
        "flex flex-col items-center justify-start gap-2 md:gap-4",
      )}
    >
      <div className={inputContainerClassname}>
        <Label htmlFor="ics-file">.ics File</Label>
        <FileInput<string>
          id="ics-file"
          setValue={setIcsFile}
          serialize={(buf): string => buf.toString("utf-8")}
          disabled={parsing}
        />
      </div>
      <div className={inputContainerClassname}>
        <Label htmlFor="project">Project Name</Label>
        <Input
          id="project"
          name="project"
          type="text"
          value={project}
          onChange={(e): void => {
            e.preventDefault();
            setProject(e.target.value);
          }}
          disabled={parsing}
        />
      </div>
      <div className={inputContainerClassname}>
        <Label htmlFor="after">Filter After</Label>
        <Input
          id="after"
          name="after"
          type="datetime-local"
          onChange={(e): void => {
            e.preventDefault();
            const maybeDate: Date | null = e.target.valueAsDate;

            if (!maybeDate) {
              setAfterDate(null);
              return;
            }
            setAfterDate(maybeDate);
            return;
          }}
          disabled={parsing}
        />
      </div>

      <Button
        onClick={onClickParseIcsFile}
        disabled={parsing}
        className="flex flex-row flex-nowrap gap-2"
      >
        <Calendar className="h-4 w-4" />
        Parse Calendar Events
      </Button>
    </div>
  );
}

export default IcsAndFiltersInputsForm;
