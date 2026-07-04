import { useState } from "react";
import { ApiError } from "../../lib/api.js";

async function fetchCsrfToken(): Promise<string> {
  const res = await fetch("/api/csrf-token", { credentials: "include" });
  if (!res.ok) throw new Error("CSRF-Token konnte nicht abgerufen werden.");
  const data = await res.json();
  return data.csrfToken as string;
}

export function useInquiryForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function submitJson(path: string, payload: unknown) {
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrfToken },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new ApiError(response.status, data?.error ?? response.statusText);
      }

      setSuccessMessage("Anfrage erfolgreich gesendet.");
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Anfrage konnte nicht gesendet werden.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function submitFormData(path: string, formData: FormData) {
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const csrfToken = await fetchCsrfToken();
      const response = await fetch(path, {
        method: "POST",
        headers: { "x-csrf-token": csrfToken },
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new ApiError(response.status, data?.error ?? response.statusText);
      }

      setSuccessMessage("Anfrage erfolgreich gesendet.");
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Anfrage konnte nicht gesendet werden.");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    isSubmitting,
    successMessage,
    errorMessage,
    setSuccessMessage,
    setErrorMessage,
    submitJson,
    submitFormData,
  };
}
