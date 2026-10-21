// Client-safe shapes. Server code builds these from @ofc/content; client components only see these.
import type { EngineQuestion } from "@ofc/engine";

export type TaskType =
  | "read" | "eli5" | "diagram" | "video" | "audio" | "worked_example"
  | "question" | "flashcard" | "calc_drill" | "teach_back" | "memory_aid";

export interface TaskSummary {
  id: string;
  type: TaskType;
  title: string;
  minutes: number;
  lo: string[];
}

export interface ModuleSummary {
  id: string;
  title: string;
  summary: string;
  los: string[];
  status: string;
  test: { count: number; pass_mark: number };
  tasks: TaskSummary[];
  questionIds: string[];
}

export interface StageSummary {
  id: string;
  title: string;
  unit: string;
  topic: string;
  summary: string;
  test: { count: number; pass_mark: number };
  modules: ModuleSummary[];
}

export interface ClientQuestion extends EngineQuestion {
  stem: string;
  scenario?: string;
  explanation: string;
  distractor_notes?: Record<string, string>;
  tax_year: string | null;
  origin: string;
  status: string;
  unit: string;
  parts?: ClientQuestion[];
}

export interface CourseIndex {
  syllabus: {
    id: string;
    name: string;
    short_name: string;
    awarding_body: string;
    version: string;
    valid_from: string;
    valid_to: string;
    units: { id: string; name: string; questions: number; duration_min: number; recommended_hours: number; pass_mark_range: [number, number] }[];
    topics: { id: string; unit: string; name: string; weight_band: [number, number] }[];
    los: { id: string; unit: string; topic: string; summary: string; verified: boolean }[];
  };
  stages: StageSummary[];
  questions: Record<string, ClientQuestion>;
  officialPapers: { id: string; unit: string; title: string; url: string; current: boolean; note?: string }[];
}

export interface DrillSpec {
  prompt: string;
  inputs: Record<string, { min: number; max: number; step: number }>;
  formula: string;
  tolerance: number;
  units?: string;
  rounds: number;
}

export interface MemoryAidSpec {
  intro?: string;
  items: { label: string; detail?: string }[];
  device: { kind: "acronym" | "phrase" | "story" | "chunks"; text: string; letters?: string };
  ordered: boolean;
}

export interface TaskDetail extends TaskSummary {
  html?: string;
  question?: string;
  front?: string;
  back?: string;
  video?: { url: string; licence: string; embed: boolean; transcript?: string };
  drill?: DrillSpec;
  memory?: MemoryAidSpec;
}
