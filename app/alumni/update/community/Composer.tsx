"use client";

import React from "react";
import UpdateComposer from "@/components/alumni/UpdateComposer";

type ToastFn = (msg: string, type?: "success" | "error") => void;

export default function CommunityComposer({
  postCurrentUpdate,
  openEventAndScroll,
  showToastRef,
}: {
  postCurrentUpdate: (rawText: string, meta?: any) => Promise<string | null>;
  openEventAndScroll: () => void;
  showToastRef: React.MutableRefObject<ToastFn | undefined>;
}) {
  return (
    <UpdateComposer
      onSubmit={async (text, meta) => {
        const id = await postCurrentUpdate(text, meta);
        return id ? { id } : undefined;
      }}
      onPosted={() => {}}
      onError={(err) => {
        const msg =
          typeof (err as any)?.message === "string"
            ? (err as any).message
            : typeof err === "string"
            ? err
            : "Something went wrong.";
        showToastRef.current?.(msg, "error");
      }}
      onAddEvent={openEventAndScroll}
    />
  );
}
