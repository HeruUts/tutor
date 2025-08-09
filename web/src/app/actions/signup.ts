"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function signupAction(formData: FormData) {
  try {
    const response = await fetch("http://localhost:8000/api/auth/register/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
        email: formData.get("email"),
      }),
      cache: "no-store",
    });

    const result = await response.json();



    return redirect("/login");

  } catch (error) {
    if (!(error instanceof Error && error.message === "NEXT_REDIRECT")) {
      console.error("Login error:", error);
    }
    throw error; // important: rethrow to let redirect() work
  }
}
