import { useEffect } from "react";
import { useParams } from 'react-router-dom';
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
 const {studentId}=useParams();
 return <ChildDetailPageComposition key={studentId} effects={scope => <ChildDetailPageDataEffects scope={scope}/>} />;
}
