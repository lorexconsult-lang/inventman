export function ActionFeedback({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-xl p-3 text-sm ${error ? "bg-warning-soft text-warning" : "bg-positive-soft text-positive"}`}
    >
      {error ?? success}
    </p>
  );
}
