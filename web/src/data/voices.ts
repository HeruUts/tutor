export enum VoiceId {
  // English voices
  alloy = "alloy",
  shimmer = "shimmer",
  echo = "echo",
  ash = "ash",
  ballad = "ballad",
  coral = "coral",
  sage = "sage",
  verse = "verse",
  
  // Japanese voices
  takumi = "takumi",
  mizuki = "mizuki",
  haruka = "haruka",
  daichi = "daichi",
}

export interface Voice {
  id: VoiceId;
  name: string;
}

export const voices: Voice[] = [
  // English voices
  {
    id: VoiceId.alloy,
    name: "Alloy",
  },
  {
    id: VoiceId.shimmer,
    name: "Shimmer",
  },
  {
    id: VoiceId.echo,
    name: "Echo",
  },
  {
    id: VoiceId.ash,
    name: "Ash",
  },
  {
    id: VoiceId.ballad,
    name: "Ballad",
  },
  {
    id: VoiceId.coral,
    name: "Coral",
  },
  {
    id: VoiceId.sage,
    name: "Sage",
  },
  {
    id: VoiceId.verse,
    name: "Verse",
  },
  
  // // Japanese voices
  // {
  //   id: VoiceId.takumi,
  //   name: "Takumi",
  // },
  // {
  //   id: VoiceId.mizuki,
  //   name: "Mizuki",
  // },
  // {
  //   id: VoiceId.haruka,
  //   name: "Haruka",
  // },
  // {
  //   id: VoiceId.daichi,
  //   name: "Daichi",
  // },
];