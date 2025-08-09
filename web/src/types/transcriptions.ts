import { RemoteParticipant } from "livekit-client";

export interface Participant {
  isAgent: boolean;
  name: string;
}

export interface Segment {
  id: string;
  text: string;
}

export interface DisplayTranscription {
  segment: Segment;
  participant: Participant | undefined; // ✅ allow undefined
  publication?: any;
}

// If you're using another Transcription type for saving:
export interface Transcription {
  segment: Segment;
  participant?: Participant; // ✅ make optional
  publication?: any;
  username: string;
  
}
