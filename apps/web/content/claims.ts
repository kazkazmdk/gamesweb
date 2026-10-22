export type MechanicalClaim = {
  id: string;
  claim: string;
  source: string;
  verify: string;
};

export const MECHANICAL_CLAIMS: MechanicalClaim[] = [
  { id: "neon-score", claim: "860", source: "games/neon-drift/src/config.ts", verify: "860" },
  { id: "neon-drift-mult", claim: "1.48×", source: "games/neon-drift/src/config.ts", verify: "1.48" },
  { id: "neon-combo", claim: "12×", source: "games/neon-drift/src/config.ts", verify: "comboMax: 12" },
  { id: "velocity-courses", claim: "12 courses", source: "games/velocity-run/src/systems/courses.ts", verify: "COURSES" },
  { id: "velocity-medals", claim: "medal targets", source: "games/velocity-run/src/systems/courses.ts", verify: "medalFor" },
  { id: "pocket-tables", claim: "18 tables", source: "games/pocket-striker/src/systems/layouts.ts", verify: "l18" },
];
