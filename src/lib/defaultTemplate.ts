export interface TemplateField {
  id: string;
  type: "text" | "textarea" | "number" | "select" | "checkbox";
  label: string;
  required: boolean;
  options?: string[];
}

export const defaultTemplate: TemplateField[] = [
  {
    id: "field-1",
    type: "textarea",
    label: "What did you accomplish today?",
    required: true,
  },
  {
    id: "field-2",
    type: "textarea",
    label: "What are you planning to work on tomorrow?",
    required: true,
  },
  {
    id: "field-3",
    type: "textarea",
    label: "Any blockers or impediments?",
    required: false,
  },
  {
    id: "field-4",
    type: "number",
    label: "Hours worked today",
    required: true,
  },
  {
    id: "field-5",
    type: "select",
    label: "How was your day overall?",
    required: false,
    options: ["Excellent", "Good", "Neutral", "Difficult", "Rough"],
  },
];
