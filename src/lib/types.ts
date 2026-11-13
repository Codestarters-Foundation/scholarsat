export type Section = "math" | "rw";
export type Difficulty = "E" | "M" | "H";

export type Table = { caption?: string; headers: string[]; rows: (string | number)[][] };

export interface Question {
  id: string;
  section: Section;
  domain: string;
  skill: string;
  difficulty: Difficulty;
  /** "mcq" = 4 choices, "spr" = student-produced response (type-in) */
  type: "mcq" | "spr";
  passage?: string;
  /** second passage for cross-text questions */
  passage2?: string;
  table?: Table;
  stem: string;
  choices?: string[];
  /** mcq: "A" | "B" | "C" | "D"; spr: canonical numeric answer as string */
  answer: string;
  explanation: string;
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { E: "Easy", M: "Medium", H: "Hard" };

export const TAXONOMY: Record<Section, { domain: string; skills: string[] }[]> = {
  rw: [
    {
      domain: "Information and Ideas",
      skills: ["Central Ideas and Details", "Command of Evidence", "Inferences"],
    },
    {
      domain: "Craft and Structure",
      skills: ["Words in Context", "Text Structure and Purpose", "Cross-Text Connections"],
    },
    { domain: "Expression of Ideas", skills: ["Rhetorical Synthesis", "Transitions"] },
    { domain: "Standard English Conventions", skills: ["Boundaries", "Form, Structure, and Sense"] },
  ],
  math: [
    {
      domain: "Algebra",
      skills: [
        "Linear equations in one variable",
        "Linear functions",
        "Linear equations in two variables",
        "Systems of two linear equations in two variables",
        "Linear inequalities in one or two variables",
      ],
    },
    {
      domain: "Advanced Math",
      skills: [
        "Equivalent expressions",
        "Nonlinear equations in one variable and systems of equations in two variables",
        "Nonlinear functions",
      ],
    },
    {
      domain: "Problem-Solving and Data Analysis",
      skills: [
        "Ratios, rates, proportional relationships, and units",
        "Percentages",
        "One-variable data: distributions and measures of center and spread",
        "Two-variable data: models and scatterplots",
        "Probability and conditional probability",
        "Inference from sample statistics and margin of error",
        "Evaluating statistical claims: observational studies and experiments",
      ],
    },
    {
      domain: "Geometry and Trigonometry",
      skills: [
        "Area and volume",
        "Lines, angles, and triangles",
        "Right triangles and trigonometry",
        "Circles",
      ],
    },
  ],
};

export const SECTION_LABEL: Record<Section, string> = { math: "Math", rw: "Reading and Writing" };
