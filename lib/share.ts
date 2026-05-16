export type ShareOutcome = "shared" | "copied" | "cancelled";

type ShareIntent = {
  title: string;
  text: string;
  url: string;
  copyText?: string;
};

export async function shareWithFallback(intent: ShareIntent): Promise<ShareOutcome> {
  const copyValue = intent.copyText ?? intent.url;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share({ title: intent.title, text: intent.text, url: intent.url });
      return "shared";
    } catch (error) {
      if (isAbortError(error)) {
        return "cancelled";
      }
    }
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(copyValue);
    return "copied";
  }

  copyTextFallback(copyValue);
  return "copied";
}

function copyTextFallback(value: string) {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);

  if (!copied) {
    throw new Error("Copy command failed.");
  }
}

function isAbortError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const name = "name" in error ? String((error as { name?: unknown }).name) : "";
  return name === "AbortError";
}
