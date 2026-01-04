type VoteValue = -1 | 0 | 1;

export type VoteDeltas = {
  scoreDelta: number;
  upvotesDelta: number;
  downvotesDelta: number;
};

/**
 * Calculate the deltas for score, upvotes, and downvotes when changing a vote
 * @param oldValue - The previous vote value (0 if no vote existed)
 * @param newValue - The new vote value
 * @returns Object with scoreDelta, upvotesDelta, and downvotesDelta
 */
export function calculateVoteDeltas(
  oldValue: number,
  newValue: number
): VoteDeltas {
  let scoreDelta = 0;
  let upvotesDelta = 0;
  let downvotesDelta = 0;

  if (oldValue !== newValue) {
    // Remove old vote effects
    if (oldValue === 1) {
      scoreDelta -= 1;
      upvotesDelta -= 1;
    } else if (oldValue === -1) {
      scoreDelta += 1;
      downvotesDelta -= 1;
    }

    // Add new vote effects
    if (newValue === 1) {
      scoreDelta += 1;
      upvotesDelta += 1;
    } else if (newValue === -1) {
      scoreDelta -= 1;
      downvotesDelta += 1;
    }
  }

  return { scoreDelta, upvotesDelta, downvotesDelta };
}

/**
 * Determine the final vote value, handling toggle behavior
 * When clicking the same value as existing, toggle off (set to 0)
 * @param requestedValue - The value the user clicked
 * @param existingValue - The current vote value (0 if no vote)
 * @returns The final vote value to apply
 */
export function resolveVoteValue(
  requestedValue: VoteValue,
  existingValue: number
): VoteValue {
  // If clicking same value, toggle off
  return requestedValue === existingValue ? 0 : requestedValue;
}

/**
 * Check if any delta has a non-zero value
 */
export function hasVoteChanges(deltas: VoteDeltas): boolean {
  return deltas.scoreDelta !== 0 || deltas.upvotesDelta !== 0 || deltas.downvotesDelta !== 0;
}
