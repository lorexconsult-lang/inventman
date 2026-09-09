"use client";

import { useEffect, useState } from "react";
import type { CatalogueActionState } from "../actions";

export function ProductCreationToast({ state }: { state: CatalogueActionState }) {
  const message = state.error ?? (state.success ? "Product created successfully." : "");
  const [dismissedMessage, setDismissedMessage] = useState<string>();

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setDismissedMessage(message), 7000);
    return () => window.clearTimeout(timeout);
  }, [message]);

  if (!message || dismissedMessage === message) return null;
  return (
    <div className="product-creation-toast" role={state.error ? "alert" : "status"}>
      <div>
        <strong>{state.error ? "Product could not be created" : "Product created"}</strong>
        <p>{message}</p>
      </div>
      <button type="button" aria-label="Dismiss product notification" onClick={() => setDismissedMessage(message)}>
        Dismiss
      </button>
    </div>
  );
}
