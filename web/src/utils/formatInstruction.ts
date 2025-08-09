// utils/formatInstructions.ts
import { UserInformation } from "./aggregate";

export const formatInstructions = (instructions: string, info: UserInformation): string => {
  let formatted = instructions.replace(/\{user\.username\}/g, info.username);

  if (info.achievements.length > 0) {
    formatted = formatted.replace(/\{user\.achievements\}/g, info.achievements.join(', '));
  } else {
    formatted = formatted.replace(/\{user\.achievements\}/g, 'no achievements yet');
  }

  return formatted;
};
