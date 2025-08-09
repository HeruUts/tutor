"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  try {
    const response = await fetch("http://127.0.0.1:8000/api/auth/login/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
      }),
      // cache: "no-store",
    });

    const result = await response.json();
   

    cookies().set("auth_token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    cookies().set("username", result.user?.username || formData.get("username"), {
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return redirect("/dashboard");

  } catch (error) {
    if (!(error instanceof Error && error.message === "NEXT_REDIRECT")) {
      console.error("Login error:", error);
    }
    throw error; // important: rethrow to let redirect() work
  }
}