// app/actions/logout.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    redirect('/');
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/api/auth/logout/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`,
      },
      credentials: "include", // Important for session/cookie based auth
    });

    if (!response.ok) {
      throw new Error(`Logout failed: ${response.statusText}`);
    }

    // Clear all auth-related cookies
    cookieStore.delete('auth_token');
    cookieStore.delete('username');
    cookieStore.delete('sessionid'); // If using session auth
    cookieStore.delete('csrftoken'); // If using CSRF

  } catch (error) {
    console.error("Logout error:", error);
    // Even if logout fails, clear client-side tokens
    cookieStore.delete('auth_token');
    cookieStore.delete('username');
  } finally {
    redirect('/');
  }
}