import AuthenticatedNotificationQueries, { type NotificationQueryProps } from "./AuthenticatedNotificationQueries";
// Preserve the existing Principal entry point and its session/resource keys.
export default function PrincipalNotificationQueries(props: NotificationQueryProps) {
  return <AuthenticatedNotificationQueries {...props} expectedRole="PRINCIPAL"/>;
}
