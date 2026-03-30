"use client";

import { useState } from "react";

export default function MailingListForm({ source = "event-detail" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [honey, setHoney] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/mailing-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, source, website: honey }),
      });
      if (!res.ok) throw new Error("submit-failed");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="evhub-ml-success">
        <span className="evhub-ml-check">✓</span>
        <div>
          <p className="evhub-ml-success-title">You&apos;re on the list.</p>
          <p className="evhub-ml-success-sub">We&apos;ll be in touch when something exciting is happening.</p>
        </div>
      </div>
    );
  }

  return (
    <form className="evhub-ml-form" onSubmit={handleSubmit} noValidate>
      {/* Honeypot — hidden from humans */}
      <input
        aria-hidden="true"
        tabIndex={-1}
        name="website"
        value={honey}
        onChange={(e) => setHoney(e.target.value)}
        style={{ display: "none" }}
        autoComplete="off"
      />
      <div className="evhub-ml-inputs-row">
        <input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="evhub-ml-input"
          autoComplete="name"
        />
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="evhub-ml-input evhub-ml-input--email"
          autoComplete="email"
        />
      </div>
      <button
        type="submit"
        className="evhub-ml-btn"
        disabled={status === "loading"}
      >
        {status === "loading" ? "Signing up…" : "Join the List →"}
      </button>
      {status === "error" && (
        <p className="evhub-ml-error">
          Something went wrong — email us at{" "}
          <a href="mailto:hello@dramaticadventure.com">hello@dramaticadventure.com</a>
        </p>
      )}
      <p className="evhub-ml-fine">
        No spam, ever. Unsubscribe any time by replying to any email.
      </p>
    </form>
  );
}
