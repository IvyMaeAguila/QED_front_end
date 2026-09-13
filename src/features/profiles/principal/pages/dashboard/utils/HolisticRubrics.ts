import type { HolisticRubric } from "../data/types";

export const HOLISTIC_RUBRIC: HolisticRubric = {
  Cognitive: [
    "Cannot demonstrate understanding",
    "Struggles to understand lessons",
    "Understands basic concepts but needs support",
    "Understands most concepts with minimal guidance",
    "Consistently understands and applies concepts independently",
  ],
  Emotional: [
    "Shows negative attitude toward learning",
    "Frequently unmotivated",
    "Sometimes disengaged or unsure",
    "Generally positive and engaged",
    "Highly motivated and confident",
  ],
  Behavioral: [
    "Consistently problematic behavior",
    "Frequently disruptive",
    "Sometimes distracted",
    "Minor issues but generally disciplined",
    "Always follows rules and stays focused",
  ],
  Social: [
    "Avoids or disrupts group work",
    "Rarely interacts",
    "Participates occasionally",
    "Works well with peers",
    "Actively collaborates and leads",
  ],
};