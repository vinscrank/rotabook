import InlineLoading from "./InlineLoading";

export default function LoadingState({ label = "Loading..." }: { label?: string }) {
  return <InlineLoading label={label} variant="page" />;
}
