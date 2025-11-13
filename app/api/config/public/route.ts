import { NextResponse } from "next/server";

export const GET = async () => {
  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID ?? null;

  return NextResponse.json({
    success: true,
    data: {
      googleClientId,
    },
  });
};
