// src/types/achievement.ts

export interface Achievement {
    id?: number;
    title: string;
    description: string;
    date: string;
  }
  
  export const initialAchievement: Achievement = {
    title: '',
    description: '',
    date: '',
  };
  