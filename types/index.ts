export type Venue = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  ownerUserId: string;
  djUserIds: string[];
  primaryColor: string;
  logoUrl: string;
  createdAt: unknown;
};

export type Session = {
  id: string;
  venueId: string;
  startedAt: unknown;
  endedAt: unknown;
  isActive: boolean;
};

export type QueueItemStatus = "pending" | "playing" | "played" | "removed";

export type QueueItem = {
  id: string;
  venueId: string;
  sessionId: string;
  itunesTrackId: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
  requestedBy: string;
  requestCount: number;
  status: QueueItemStatus;
  requestedAt: unknown;
  playedAt?: unknown;
  playedBefore?: boolean;
  likeCount: number;
  likedBy: string[];
};
