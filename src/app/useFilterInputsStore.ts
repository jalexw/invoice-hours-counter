"use client";

import { create } from "zustand";

export interface IInvoiceHoursCounterFilterInputsState {
  project: string;
  setProject: (project: string) => void;
  after: Date | null;
  setAfterDate: (date: Date | null) => void;
  before: Date | null;
  setBeforeDate: (date: Date | null) => void;
}

const useFilterInputsStore = create<IInvoiceHoursCounterFilterInputsState>(
  (set) => ({
    project: "",
    setProject: (project: string) => set({ project }),
    after: null,
    setAfterDate: (after: Date | null) => set({ after }),
    before: null,
    setBeforeDate: (before: Date | null) => set({ before }),
  }),
);

export default useFilterInputsStore;
