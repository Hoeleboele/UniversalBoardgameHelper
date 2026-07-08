/**
 * Player color palette. `light` marks colors needing dark text for contrast.
 */
export const COLORS = [
  { id: "red", value: "#e03131", light: false },
  { id: "blue", value: "#1971c2", light: false },
  { id: "green", value: "#2f9e44", light: false },
  { id: "purple", value: "#7048e8", light: false },
  { id: "black", value: "#16191d", light: false },
  { id: "white", value: "#f1f3f5", light: true },
  { id: "yellow", value: "#f3c000", light: true },
  { id: "orange", value: "#f76707", light: false },
];

export const DEFAULT_COLOR_ID = "blue";

export function getColor(id) {
  return COLORS.find((c) => c.id === id) || COLORS[0];
}
