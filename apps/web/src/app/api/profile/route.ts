import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

type ProfilePayload = {
  locationCity?: string;
  locationRadiusKm?: number;
  educationLevel?: string;
  educationField?: string;
  interests?: string[] | string;
};

function normalizeInterests(value: ProfilePayload["interests"]) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((entry) => entry.trim()).filter(Boolean);
  }
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
  });
  return NextResponse.json(profile ?? {});
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await request.json()) as ProfilePayload;
  const interests = normalizeInterests(body.interests);

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: {
      locationCity: body.locationCity?.trim() || null,
      locationRadiusKm:
        typeof body.locationRadiusKm === "number"
          ? body.locationRadiusKm
          : null,
      educationLevel: body.educationLevel?.trim() || null,
      educationField: body.educationField?.trim() || null,
      interests,
    },
    create: {
      userId: session.user.id,
      locationCity: body.locationCity?.trim() || null,
      locationRadiusKm:
        typeof body.locationRadiusKm === "number"
          ? body.locationRadiusKm
          : null,
      educationLevel: body.educationLevel?.trim() || null,
      educationField: body.educationField?.trim() || null,
      interests,
    },
  });

  return NextResponse.json(profile);
}
