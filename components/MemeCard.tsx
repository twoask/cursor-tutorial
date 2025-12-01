"use client";

import { useAuth, useQuery, tx, transact, id as dbId } from "@/lib/instantdb";
import type { Meme } from "@/lib/schema";
import { useRouter } from "next/navigation";

interface MemeCardProps {
  meme: Meme;
  onImageClick?: () => void;
}

export function MemeCard({ meme, onImageClick }: MemeCardProps) {
  const { user } = useAuth();
  const router = useRouter();

  // Query to check if user has upvoted this meme
  const { data: upvoteData } = useQuery({
    upvotes: {
      $: {
        where: {
          memeId: meme.id,
          userId: user?.id || "",
        },
      },
    },
  });

  const hasUpvoted = upvoteData?.upvotes && upvoteData.upvotes.length > 0;

  const handleUpvote = async () => {
    if (!user) {
      alert("Please sign in to upvote memes");
      return;
    }

    try {
      if (hasUpvoted && upvoteData?.upvotes) {
        // Remove upvote
        const upvote = upvoteData.upvotes[0];
        transact(
          tx.upvotes[upvote.id].delete(),
          tx.memes[meme.id].update({
            upvotes: Math.max(0, (meme.upvotes || 0) - 1),
          })
        );
      } else {
        // Add upvote
        const upvoteId = dbId();
        transact(
          tx.upvotes[upvoteId].update({
            memeId: meme.id,
            userId: user.id,
            createdAt: Date.now(),
          }),
          tx.memes[meme.id].update({
            upvotes: (meme.upvotes || 0) + 1,
          })
        );
      }
    } catch (error) {
      console.error("Error upvoting:", error);
    }
  };

  const handleEdit = () => {
    router.push(`/create?edit=${meme.id}`);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this meme?")) return;

    try {
      transact(tx.memes[meme.id].delete());
    } catch (error) {
      console.error("Error deleting meme:", error);
      alert("Failed to delete meme. Please try again.");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const isOwner = user?.id === meme.userId;

  return (
    <div className="meme-card">
      <div 
        className="meme-image-container" 
        onClick={onImageClick}
        style={{ cursor: onImageClick ? 'pointer' : 'default' }}
      >
        <img src={meme.imageData} alt="Meme" className="meme-image" />
      </div>
      <div className="meme-card-footer">
        <div className="meme-meta">
          <div className="meme-author">Posted by {meme.userId.slice(0, 8)}...</div>
          <div className="meme-date">{formatDate(meme.createdAt)}</div>
          {isOwner && (
            <div className="meme-actions">
              <button className="action-btn" onClick={handleEdit}>
                Edit
              </button>
              <button className="action-btn danger" onClick={handleDelete}>
                Delete
              </button>
            </div>
          )}
        </div>
        <div className="upvote-section">
          <button
            className={`upvote-btn ${hasUpvoted ? "upvoted" : ""}`}
            onClick={handleUpvote}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 13L12 18L17 13M7 6L12 11L17 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform={hasUpvoted ? "rotate(180 12 12)" : ""}
              />
            </svg>
            <span className="upvote-count">{meme.upvotes || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

