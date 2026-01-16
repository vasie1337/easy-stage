"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type ProfileFormProps = {
  initialValues?: {
    locationCity?: string | null;
    locationRadiusKm?: number | null;
    educationLevel?: string | null;
    educationField?: string | null;
    interests?: string[] | null;
  };
};

export function ProfileForm({ initialValues }: ProfileFormProps) {
  const [locationCity, setLocationCity] = useState(
    initialValues?.locationCity ?? ""
  );
  const [locationRadiusKm, setLocationRadiusKm] = useState(
    initialValues?.locationRadiusKm?.toString() ?? ""
  );
  const [educationLevel, setEducationLevel] = useState(
    initialValues?.educationLevel ?? ""
  );
  const [educationField, setEducationField] = useState(
    initialValues?.educationField ?? ""
  );
  const [interests, setInterests] = useState(
    initialValues?.interests?.join(", ") ?? ""
  );
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  const onSave = async () => {
    setStatus("saving");
    const payload = {
      locationCity,
      locationRadiusKm: locationRadiusKm
        ? Number(locationRadiusKm)
        : undefined,
      educationLevel,
      educationField,
      interests,
    };
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error("Failed");
      }
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="font-medium">City</span>
          <input
            value={locationCity}
            onChange={(event) => setLocationCity(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Utrecht"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Radius (km)</span>
          <input
            value={locationRadiusKm}
            onChange={(event) => setLocationRadiusKm(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="25"
            type="number"
            min={0}
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Education level</span>
          <input
            value={educationLevel}
            onChange={(event) => setEducationLevel(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="HBO / WO"
          />
        </label>
        <label className="space-y-2 text-sm">
          <span className="font-medium">Field of study</span>
          <input
            value={educationField}
            onChange={(event) => setEducationField(event.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            placeholder="Computer Science"
          />
        </label>
      </div>
      <label className="space-y-2 text-sm">
        <span className="font-medium">Interests (comma separated)</span>
        <input
          value={interests}
          onChange={(event) => setInterests(event.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="backend, data, fintech"
        />
      </label>
      <div className="flex items-center gap-3">
        <Button onClick={onSave} disabled={status === "saving"}>
          {status === "saving" ? "Saving..." : "Save profile"}
        </Button>
        {status === "saved" ? (
          <span className="text-sm text-green-600">Saved.</span>
        ) : null}
        {status === "error" ? (
          <span className="text-sm text-destructive">Save failed.</span>
        ) : null}
      </div>
    </div>
  );
}
