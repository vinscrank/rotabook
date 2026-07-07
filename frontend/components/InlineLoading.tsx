export default function InlineLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="glass-panel rounded-2xl px-5 py-4 text-sm text-gray-300">
      <span className="inline-flex items-center gap-3">
        <span className="size-4 rounded-full border-2 border-violet-300/30 border-t-violet-300 animate-spin" />
        {label}
      </span>
    </div>
  );
}
