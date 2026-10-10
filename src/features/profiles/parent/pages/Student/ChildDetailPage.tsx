import { useEffect } from "react";
import { ChildDetailPageComposition,type ChildDetailPageEffectScope } from "./ChildDetailPage.loading-view";
export * from "./ChildDetailPage.loading-view";

function ChildDetailPageDataEffects({ scope }: { scope: ChildDetailPageEffectScope }) {
 const { setActiveTab, requestedTab, studentId, location } = scope;
 useEffect(() => {
  setActiveTab(requestedTab ?? "overview");
}, [studentId, requestedTab, location.key]);
 return null;
}

export default function ChildDetailPage() {
 return <ChildDetailPageComposition effects={scope => <ChildDetailPageDataEffects scope={scope}/>} />;
}
