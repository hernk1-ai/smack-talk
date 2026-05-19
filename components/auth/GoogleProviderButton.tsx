type GoogleProviderButtonProps = {
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function GoogleProviderButton({ loading, disabled = false, onClick }: GoogleProviderButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="grid min-h-12 w-full grid-cols-[auto_1fr] items-center gap-3 rounded-xl border border-white/20 bg-black/70 px-4 text-left transition hover:-translate-y-0.5 hover:border-purple-300/55 hover:bg-gradient-to-r hover:from-lime-400/10 hover:to-purple-500/10 disabled:cursor-not-allowed disabled:opacity-65"
    >
      <GoogleProviderIcon />
      <span className="text-sm font-black uppercase tracking-[0.12em] text-white">
        {loading ? "Connecting..." : "Continue with Google"}
      </span>
    </button>
  );
}

function GoogleProviderIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.2-1.4 3.6-5.5 3.6-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3 14.7 2 12 2a10 10 0 1 0 0 20c5.8 0 9.6-4 9.6-9.7 0-.7-.1-1.3-.2-1.8H12Z" />
      <path fill="#4285F4" d="M2 12c0 1.6.4 3.2 1.2 4.5l3.2-2.5A6 6 0 0 1 6 12c0-.7.1-1.4.4-2L3.2 7.5A10 10 0 0 0 2 12Z" />
      <path fill="#FBBC05" d="M12 22c2.7 0 4.9-.9 6.5-2.4l-3.1-2.5c-.8.5-1.9.9-3.4.9-2.6 0-4.8-1.7-5.6-4.1l-3.2 2.5A10 10 0 0 0 12 22Z" />
      <path fill="#34A853" d="M6.4 13.9A6 6 0 0 1 6 12c0-.7.1-1.4.4-2L3.2 7.5a10 10 0 0 0 0 9l3.2-2.6Z" />
    </svg>
  );
}
