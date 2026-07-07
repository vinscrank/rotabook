import { CheckCircle2, XCircle } from "lucide-react";

type FeedbackMessageProps = {
  message: string;
  variant?: "success" | "error";
};

export default function FeedbackMessage({ message, variant = "success" }: FeedbackMessageProps) {
  const isError = variant === "error";

  return (
    <div
      role="alert"
      className={`mb-6 max-w-3xl mx-auto flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${
        isError
          ? "border-red-400/30 bg-red-500/10 text-red-100"
          : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
      }`}
    >
      {isError ? (
        <XCircle className="size-5 shrink-0 text-red-300" />
      ) : (
        <CheckCircle2 className="size-5 shrink-0 text-emerald-300" />
      )}
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
