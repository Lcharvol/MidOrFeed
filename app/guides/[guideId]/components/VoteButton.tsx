"use client";

import { Button } from "@/components/ui/button";
import { ThumbsUpIcon, ThumbsDownIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { useState } from "react";
import type { ChampionGuide } from "@/types/guides";

export const VoteButton = ({
  guide,
  onVote,
}: {
  guide: ChampionGuide;
  onVote: (value: -1 | 0 | 1) => void;
}) => {
  const { user } = useAuth();
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (value: -1 | 1) => {
    if (!user) {
      toast.error("Connectez-vous pour voter");
      return;
    }
    setIsVoting(true);
    try {
      await onVote(value);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Voter pour ce guide">
      <Button
        variant={guide.viewerVote === 1 ? "default" : "outline"}
        size="sm"
        onClick={() => handleVote(1)}
        disabled={isVoting}
        aria-label={`Vote positif (${guide.upvotes} votes)`}
        aria-pressed={guide.viewerVote === 1}
      >
        <ThumbsUpIcon className="size-4 mr-1" aria-hidden="true" />
        <span aria-live="polite">{guide.upvotes}</span>
      </Button>
      <Button
        variant={guide.viewerVote === -1 ? "destructive" : "outline"}
        size="sm"
        onClick={() => handleVote(-1)}
        disabled={isVoting}
        aria-label={`Vote negatif (${guide.downvotes} votes)`}
        aria-pressed={guide.viewerVote === -1}
      >
        <ThumbsDownIcon className="size-4 mr-1" aria-hidden="true" />
        <span aria-live="polite">{guide.downvotes}</span>
      </Button>
    </div>
  );
};
