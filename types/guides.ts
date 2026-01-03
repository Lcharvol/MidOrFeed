// Champion Guides Types

export type GuideRole = "TOP" | "JUNGLE" | "MID" | "ADC" | "SUPPORT";
export type GuideStatus = "draft" | "published";
export type MatchupDifficulty = "easy" | "medium" | "hard";
export type SkillKey = "Q" | "W" | "E" | "R";

// Item Build Configuration
export interface ItemBuildConfig {
  starter: string[]; // itemIds
  core: string[];
  situational: string[];
  boots: string[];
}

// Skill Order Configuration (levels 1-18)
export interface SkillOrderConfig {
  levels: Record<number, SkillKey>; // 1-18 -> skill
  maxOrder: ("Q" | "W" | "E")[]; // Priority order for maxing skills
}

// Rune Configuration
export interface RuneConfig {
  primary: {
    tree: string; // Precision, Domination, Sorcery, Resolve, Inspiration
    keystone: string;
    slots: string[]; // 3 rune selections
  };
  secondary: {
    tree: string;
    slots: string[]; // 2 rune selections
  };
  shards: [string, string, string]; // Stat shards
}

// Matchup Entry
export interface MatchupEntry {
  championId: string;
  difficulty?: MatchupDifficulty;
  notes?: string;
}

// Main Guide Interface
export interface ChampionGuide {
  id: string;
  championId: string;
  authorId: string | null;
  authorName: string | null;
  title: string;
  introduction: string | null;

  // Build data
  itemBuild: ItemBuildConfig | null;
  skillOrder: SkillOrderConfig | null;
  runeConfig: RuneConfig | null;
  summonerSpells: [number, number] | null;

  // Gameplay sections
  earlyGameTips: string | null;
  midGameTips: string | null;
  lateGameTips: string | null;

  // Matchups
  goodMatchups: MatchupEntry[] | null;
  badMatchups: MatchupEntry[] | null;

  // Strengths/Weaknesses
  strengths: string[] | null;
  weaknesses: string[] | null;

  // Metadata
  patchVersion: string | null;
  role: GuideRole | null;

  // Stats
  score: number;
  upvotes: number;
  downvotes: number;
  viewCount: number;

  status: GuideStatus;

  createdAt: string;
  updatedAt: string;

  // Viewer-specific context (populated by API)
  viewerVote?: -1 | 0 | 1 | null;
  canEdit?: boolean;
  canDelete?: boolean;
}

// Guide Summary (for list views)
export interface GuideSummary {
  id: string;
  championId: string;
  authorId: string | null;
  authorName: string | null;
  title: string;
  introduction: string | null;
  role: GuideRole | null;
  patchVersion: string | null;
  score: number;
  upvotes: number;
  downvotes: number;
  viewCount: number;
  status: GuideStatus;
  createdAt: string;
  updatedAt: string;
  viewerVote?: -1 | 0 | 1 | null;
}

// Guide Comment
export interface GuideComment {
  id: string;
  guideId: string;
  authorId: string | null;
  authorName: string | null;
  content: string;
  score: number;
  upvotes: number;
  downvotes: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  viewerVote?: -1 | 0 | 1 | null;
  canEdit?: boolean;
  canDelete?: boolean;
  replies?: GuideComment[];
}

// API Request/Response Types
export interface CreateGuideRequest {
  championId: string;
  title: string;
  introduction?: string;
  itemBuild?: ItemBuildConfig;
  skillOrder?: SkillOrderConfig;
  runeConfig?: RuneConfig;
  summonerSpells?: [number, number];
  earlyGameTips?: string;
  midGameTips?: string;
  lateGameTips?: string;
  goodMatchups?: MatchupEntry[];
  badMatchups?: MatchupEntry[];
  strengths?: string[];
  weaknesses?: string[];
  patchVersion?: string;
  role?: GuideRole;
  status?: GuideStatus;
}

export interface UpdateGuideRequest extends Partial<CreateGuideRequest> {}

export interface GuideListParams {
  championId?: string;
  role?: GuideRole;
  authorId?: string;
  status?: GuideStatus;
  sort?: "popular" | "recent" | "views";
  limit?: number;
  offset?: number;
}

export interface VoteRequest {
  guideId: string;
  value: -1 | 0 | 1;
}

export interface CommentVoteRequest {
  commentId: string;
  value: -1 | 0 | 1;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: string;
}

// API Response Types
export interface GuideListResponse {
  guides: GuideSummary[];
  total: number;
  hasMore: boolean;
}

export interface GuideDetailResponse {
  guide: ChampionGuide;
}

export interface GuideCommentsResponse {
  comments: GuideComment[];
  total: number;
}
