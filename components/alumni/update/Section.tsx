"use client";
export default function Section({
  title, subtitle, right, children,
}: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode; }) {
  return (
    <section className="mb-10 rounded-xl border bg-white p-5 md:p-6" style={{ borderColor: "#e5e5e5" }}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold" style={{ color: "#6C00AF" }}>{title}</h2>
          {subtitle ? <p className="mt-1 text-sm md:text-base" style={{ color: "#241123" }}>{subtitle}</p> : null}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
