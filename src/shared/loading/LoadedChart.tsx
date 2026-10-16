import * as charts from "recharts";
import type { ReactNode } from "react";
export default function LoadedChart({ render }: { render: (runtime: typeof charts) => ReactNode }) {
  return render(charts);
}
