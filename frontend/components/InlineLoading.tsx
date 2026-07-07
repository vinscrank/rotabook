type InlineLoadingProps = {
  label?: string;
  variant?: "inline" | "page" | "overlay";
};

export default function InlineLoading({ label = "Loading...", variant = "inline" }: InlineLoadingProps) {
  const isLarge = variant === "page" || variant === "overlay";

  const panel = (
    <div
      className={`glass-panel rounded-2xl text-center ${
        isLarge ? "px-10 py-10 min-w-[220px]" : "px-5 py-4"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className={`relative ${isLarge ? "size-14" : "size-5"}`}>
          <span className="absolute inset-0 rounded-full border-2 border-violet-400/20" />
          <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-400 border-r-pink-400 animate-spin" />
          {isLarge && <span className="absolute inset-3 rounded-full bg-violet-500/25 animate-pulse" />}
        </div>
        <p className={`text-gray-300 ${isLarge ? "text-base font-medium" : "text-sm"}`}>{label}</p>
      </div>
    </div>
  );

  if (variant === "page") {
    return <div className="min-h-[60vh] flex items-center justify-center px-4">{panel}</div>;
  }

  if (variant === "overlay") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/75 backdrop-blur-sm px-4">
        {panel}
      </div>
    );
  }

  return panel;
}
