import {useEffect} from 'react';
import {useNotifications} from '@shared/notification/NotificationContext';
import {useStudents} from '../pages/studentrecords/context/StudentsContext';
import {useClasses} from '../pages/classes/context/ClassesContext';
import {useTeachers} from '../pages/classes/context/TeachersContext';
import {useUsers} from '../pages/usermanagement/context/UsersContext';
// Keep notification Query execution behind the established Admin bootstrap.
// This lightweight gate must not import the Query runtime.
export function AdminNotificationActivation(){const {activateAdminQueries}=useNotifications(),{loading:s}=useStudents(),{loading:c}=useClasses(),{loading:t}=useTeachers(),{loading:u}=useUsers();useEffect(()=>{if(s||c||t||u)return;const activate=()=>activateAdminQueries?.();activate();window.addEventListener('online',activate);return()=>window.removeEventListener('online',activate);},[s,c,t,u,activateAdminQueries]);return null;}
