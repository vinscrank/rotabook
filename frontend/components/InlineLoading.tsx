type InlineLoadingProps = {
  label?: string;
  variant?: "inline" | "page";
};

export default function InlineLoading({ label = "Loading...", variant = "inline" }: InlineLoadingProps) {
  const isPage = variant === "page";

  const panel = (
    <div
      className={`glass-panel rounded-2xl text-center ${
        isPage ? "px-10 py-10 min-w-[220px]" : "px-5 py-4"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className={`relative ${isPage ? "size-14" : "size-5"}`}>
          <span className="absolute inset-0 rounded-full border-2 border-violet-400/20" />
          <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-400 border-r-pink-400 animate-spin" />
          {isPage && <span className="absolute inset-3 rounded-full bg-violet-500/25 animate-pulse" />}
        </div>
        <p className={`text-gray-300 ${isPage ? "text-base font-medium" : "text-sm"}`}>{label}</p>
      </div>
    </div>
  );

  if (isPage) {
    return <div className="min-h-[60vh] flex items-center justify-center px-4">{panel}</div>;
  }

  return panel;
}
