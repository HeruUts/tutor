// utils/aggregate.ts
import { getUsernameFromCookie } from "./cookies";
import { getAchievements } from "@/lib/api/achievement";

export interface UserInformation {
  username: string;
  achievements: string[];
}

export const getUserInformation = async (): Promise<UserInformation> => {
  const username = getUsernameFromCookie() || "friend";
  const achievementsData = await getAchievements();

  const achievements: string[] = achievementsData.map(a =>
    typeof a === "string" ? a : a.title || ""
  );

  return { username, achievements };
};
