"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageSquareIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  ReplyIcon,
  Loader2Icon,
  UserIcon,
} from "lucide-react";
import {
  useGuideComments,
  useCreateComment,
  useCommentVote,
} from "@/lib/hooks/use-guide-comments";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import type { GuideComment } from "@/types/guides";
import { cn } from "@/lib/utils";

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Single Comment Component
const CommentItem = ({
  comment,
  guideId,
  onReply,
  depth = 0,
}: {
  comment: GuideComment;
  guideId: string;
  onReply: (parentId: string) => void;
  depth?: number;
}) => {
  const { user } = useAuth();
  const { vote } = useCommentVote();
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (value: -1 | 1) => {
    if (!user) {
      toast.error("Connectez-vous pour voter");
      return;
    }

    setIsVoting(true);
    try {
      const newValue = comment.viewerVote === value ? 0 : value;
      await vote(comment.id, newValue as -1 | 0 | 1, guideId);
    } catch {
      toast.error("Erreur lors du vote");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className={cn("space-y-2", depth > 0 && "ml-4 sm:ml-8 pl-3 sm:pl-4 border-l")}>
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="size-7 sm:size-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <UserIcon className="size-3 sm:size-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm flex-wrap">
            <span className="font-medium">
              {comment.authorName || "Anonyme"}
            </span>
            <span className="text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          <p className="text-xs sm:text-sm mt-1 whitespace-pre-line">{comment.content}</p>
          <div className="flex items-center gap-1 sm:gap-2 mt-2" role="group" aria-label="Voter pour ce commentaire">
            <Button
              variant={comment.viewerVote === 1 ? "default" : "ghost"}
              size="sm"
              className="h-6 sm:h-7 px-1.5 sm:px-2 text-xs"
              onClick={() => handleVote(1)}
              disabled={isVoting}
              aria-label={`Vote positif (${comment.upvotes})`}
              aria-pressed={comment.viewerVote === 1}
            >
              <ThumbsUpIcon className="size-3 mr-0.5 sm:mr-1" aria-hidden="true" />
              {comment.upvotes}
            </Button>
            <Button
              variant={comment.viewerVote === -1 ? "destructive" : "ghost"}
              size="sm"
              className="h-6 sm:h-7 px-1.5 sm:px-2 text-xs"
              onClick={() => handleVote(-1)}
              disabled={isVoting}
              aria-label={`Vote negatif (${comment.downvotes})`}
              aria-pressed={comment.viewerVote === -1}
            >
              <ThumbsDownIcon className="size-3 mr-0.5 sm:mr-1" aria-hidden="true" />
              {comment.downvotes}
            </Button>
            {depth === 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 sm:h-7 px-1.5 sm:px-2 text-xs"
                onClick={() => onReply(comment.id)}
              >
                <ReplyIcon className="size-3 mr-0.5 sm:mr-1" />
                <span className="hidden xs:inline">Répondre</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3 mt-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              guideId={guideId}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Comment Form Component
const CommentForm = ({
  guideId,
  parentId,
  onCancel,
  onSuccess,
}: {
  guideId: string;
  parentId?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}) => {
  const { user } = useAuth();
  const { createComment } = useCreateComment();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Connectez-vous pour commenter");
      return;
    }

    if (!content.trim()) {
      toast.error("Le commentaire ne peut pas être vide");
      return;
    }

    setIsSubmitting(true);
    try {
      await createComment(guideId, { content: content.trim(), parentId });
      setContent("");
      toast.success("Commentaire ajouté");
      onSuccess?.();
    } catch {
      toast.error("Erreur lors de l'ajout du commentaire");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        <a href="/login" className="text-primary hover:underline">
          Connectez-vous
        </a>{" "}
        pour laisser un commentaire
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? "Écrire une réponse..." : "Écrire un commentaire..."}
        rows={3}
        maxLength={2000}
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Annuler
          </Button>
        )}
        <Button type="submit" size="sm" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? (
            <>
              <Loader2Icon className="size-4 mr-2 animate-spin" />
              Envoi...
            </>
          ) : (
            "Publier"
          )}
        </Button>
      </div>
    </form>
  );
};

// Main Comments Section
export const GuideComments = ({ guideId }: { guideId: string }) => {
  const { comments, total, isLoading, revalidate } = useGuideComments(guideId);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
  };

  const handleReplySuccess = () => {
    setReplyingTo(null);
    revalidate();
  };

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-6">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <MessageSquareIcon className="size-4 sm:size-5" />
          Commentaires ({total})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
        {/* New Comment Form */}
        <CommentForm guideId={guideId} onSuccess={revalidate} />

        {/* Comments List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-2 sm:gap-3">
                <Skeleton className="size-7 sm:size-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24 sm:w-32" />
                  <Skeleton className="h-12 sm:h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center text-sm sm:text-base text-muted-foreground py-6 sm:py-8">
            Aucun commentaire. Soyez le premier !
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {comments.map((comment) => (
              <div key={comment.id}>
                <CommentItem
                  comment={comment}
                  guideId={guideId}
                  onReply={handleReply}
                />
                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <div className="ml-9 sm:ml-11 mt-3">
                    <CommentForm
                      guideId={guideId}
                      parentId={comment.id}
                      onCancel={() => setReplyingTo(null)}
                      onSuccess={handleReplySuccess}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
