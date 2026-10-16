import type { CSSProperties } from "react";

const MEDAL_FINISHES: Record<number, CSSProperties> = {
  1: {
    background: "#DEC77F",
    color: "#5A4816",
    border: "1px solid #D5BD70",
  },
  2: {
    background: "#C9CFD4",
    color: "#4D5660",
    border: "1px solid #C2C9CE",
  },
  3: {
    background: "#CF9C7D",
    color: "#63402D",
    border: "1px solid #C78F6D",
  },
};

export function getMedalStyle(rank: number): CSSProperties | undefined {
  return MEDAL_FINISHES[rank];
}
