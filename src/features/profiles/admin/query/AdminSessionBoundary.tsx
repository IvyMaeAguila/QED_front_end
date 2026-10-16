import {Fragment,type ReactNode} from 'react';
import {useAuth} from '@shared/hooks/useAuth';
export function AdminSessionBoundary({children,resource=''}:{children:ReactNode;resource?:string}){
 const {sessionScope,user}=useAuth();return <Fragment key={`${sessionScope}:${user?.role}:${user?.id}:${resource}`}>{children}</Fragment>;
}
