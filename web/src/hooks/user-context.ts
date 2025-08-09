// hooks/useUserContext.ts
import { useEffect, useState } from 'react';
import { getUsernameFromCookie } from '../utils/cookies';

export const useUserContext = () => {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usernameFromCookie = getUsernameFromCookie();
    setUsername(usernameFromCookie);
    setLoading(false);
  }, []);

  return { username, loading };
};