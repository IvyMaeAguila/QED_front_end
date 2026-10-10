import { useEffect } from "react";
import { UserFormPageComposition,type UserFormPageEffectScope } from "./UserFormPage.loading-view";
export * from "./UserFormPage.loading-view";

function UserFormPageDataEffects({ scope }: { scope: UserFormPageEffectScope }) {
 const { role, userId, isEditing, existing, loading, seededRecord, setForm, toStr } = scope;
 useEffect(() => {
    const key = `${role}/${userId}`;
    if (!isEditing || !existing || loading || seededRecord.current === key) return;
    seededRecord.current = key;
    setForm({ lastName: toStr(existing.lastName), firstName: toStr(existing.firstName), middleName: toStr(existing.middleName), role: existing.role, email: toStr(existing.email), contactNumber: toStr(existing.contactNumber), status: existing.status, gender: existing.gender ?? "" });
  }, [existing, loading, isEditing, role, userId]);
 return null;
}

export function UserFormPage() {
 return <UserFormPageComposition effects={scope => <UserFormPageDataEffects scope={scope}/>} />;
}
