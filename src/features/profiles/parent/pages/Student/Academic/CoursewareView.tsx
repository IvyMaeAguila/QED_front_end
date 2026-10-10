import { useEffect } from "react";
import { CoursewareViewComposition,type CoursewareViewEffectScope,type CoursewareViewRouteProps } from "./CoursewareView.loading-view";
export * from "./CoursewareView.loading-view";

function CoursewareViewDataEffects({ scope }: { scope: CoursewareViewEffectScope }) {
 const { studentId, topicId, setLoading, setError, setSelectedVideo, getCourseware, setData, attempt } = scope;
 useEffect(() => {
    if (!studentId || !topicId) return;
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);
      setSelectedVideo(null);
      try {
        const result = await getCourseware(studentId!, topicId!);
        if (isMounted) setData(result);
      } catch (err) {
        console.error("Failed to load courseware:", err);
        if (isMounted) setError("We couldn't generate learning resources right now. Please try again later.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [studentId, topicId, attempt]);
 return null;
}

export default function CoursewareView(props: CoursewareViewRouteProps) {
 return <CoursewareViewComposition {...props} effects={scope => <CoursewareViewDataEffects scope={scope}/>} />;
}
