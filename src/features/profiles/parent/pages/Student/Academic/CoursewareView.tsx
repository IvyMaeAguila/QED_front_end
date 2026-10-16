import { useParams } from 'react-router-dom';
import { useParentReader } from '../../../query/useParentReader';
import { CoursewareViewComposition, type CoursewareViewRouteProps } from './CoursewareView.loading-view';
import { getCourseware } from './service/courseware.service';
import {QueryClientProvider} from '@tanstack/react-query';
import {queryClient} from '@shared/query/queryClient';
export * from './CoursewareView.loading-view';
export default function CoursewareView(props:CoursewareViewRouteProps) {
  const {studentId,topicId}=useParams();
  // This GET can generate/persist AI resources. Do not abort/replay that server
  // operation on StrictMode cleanup, focus or reconnect. Query dedupes it;
  // expiry still checks the originating session generation.
  const reader=useParentReader(['student',studentId,'courseware',topicId],options=>getCourseware(studentId!,topicId!,options),"We couldn't generate learning resources right now. Please try again later.",!!studentId&&!!topicId,undefined,300_000,undefined,{cancellable:false,reconnect:false});
  const error=reader.error&&!reader.offline&&!reader.denied?"We couldn't generate learning resources right now. Please try again later.":reader.error;
  return <QueryClientProvider client={queryClient}><CoursewareViewComposition {...props} key={`${studentId}:${topicId}`} serverState={{...reader,error}}/></QueryClientProvider>;
}
