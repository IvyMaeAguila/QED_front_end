import type { CSSProperties } from "react";

const MEDAL_FINISHES: Record<number, CSSProperties> = {
  1: {
    background: "linear-gradient(135deg, #F3E6B7 0%, #DEC77F 52%, #F5EBCB 100%)",
    color: "#5A4816",
    border: "1px solid #D5BD70",
  },
  2: {
    background: "linear-gradient(135deg, #EDF0F2 0%, #C9CFD4 52%, #F5F6F7 100%)",
    color: "#4D5660",
    border: "1px solid #C2C9CE",
  },
  3: {
    background: "linear-gradient(135deg, #EAD0BE 0%, #CF9C7D 52%, #EBD8CB 100%)",
    color: "#63402D",
    border: "1px solid #C78F6D",
  },
};

export function getMedalStyle(rank: number): CSSProperties | undefined {
  return MEDAL_FINISHES[rank];
}
