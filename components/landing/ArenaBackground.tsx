export function ArenaBackground() {
  return (
    <div className="arena-preview-bg pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="arena-preview-bg__phone-glow" />
      <div className="arena-preview-bg__left-glow" />
      <div className="arena-preview-bg__flare arena-preview-bg__flare--left" />
      <div className="arena-preview-bg__flare arena-preview-bg__flare--right" />
      <div className="arena-preview-bg__streak arena-preview-bg__streak--one" />
      <div className="arena-preview-bg__streak arena-preview-bg__streak--two" />
      <div className="arena-preview-bg__crowd" />
      <div className="arena-preview-bg__grain" />
    </div>
  );
}
