"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SaveIcon, Loader2Icon } from "lucide-react";

export const GuideFormActions = ({
  isSubmitting,
  disabled,
}: {
  isSubmitting: boolean;
  disabled: boolean;
}) => (
  <div className="flex justify-end gap-4">
    <Button type="button" variant="outline" asChild>
      <Link href="/guides">Annuler</Link>
    </Button>
    <Button type="submit" disabled={disabled}>
      {isSubmitting ? (
        <>
          <Loader2Icon className="size-4 mr-2 animate-spin" />
          Publication...
        </>
      ) : (
        <>
          <SaveIcon className="size-4 mr-2" />
          Publier le guide
        </>
      )}
    </Button>
  </div>
);
