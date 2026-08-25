import { useEffect, useState } from "react";
import { getUserData, type UserData } from "../../parent/pages/dashboard/services/dashboard.service";

export function useUserProfile() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const data = await getUserData();
        if (isMounted) setUserData(data);
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return { userData, isLoading, error };
}