export default function InfoCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-(--border) bg-(--card) p-4">
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-(--muted)">{desc}</div>
    </div>
  );
}