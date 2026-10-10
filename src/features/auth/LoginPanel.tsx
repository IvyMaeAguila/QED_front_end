import { LoginPanelComposition,type LoginPanelRouteProps } from "./LoginPanel.loading-view";
export * from "./LoginPanel.loading-view";

export function LoginPanel(props: LoginPanelRouteProps) {
 return <LoginPanelComposition {...props}/>;
}
