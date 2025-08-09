// function getCookie(name: string) {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${name}=`);
//     if (parts.length === 2) return parts.pop()?.split(';').shift();
//   }

  // utils/cookies.ts
export const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null; // SSR guard
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
  return null;
};

export const getUsernameFromCookie = (): string | null => {
  return getCookie('username');
};