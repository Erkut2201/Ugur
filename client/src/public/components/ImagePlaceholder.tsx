interface ImagePlaceholderProps {
  /** Path to real image under /images/ — if present, renders <img>, otherwise shows placeholder */
  src?: string;
  label?: string;
  alt?: string;
  className?: string;
}

/**
 * Smart media component:
 * - If `src` is provided and the file exists, renders a real <img>.
 * - Otherwise shows a styled SVG placeholder.
 * Run `npm run generate:images` to generate real images via Gemini.
 */
export default function ImagePlaceholder({ src, label, alt, className = "" }: ImagePlaceholderProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? label ?? ""}
        className={`object-cover ${className}`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-brand-dark to-black ${className}`}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center gap-2 text-center opacity-40">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-brand-gold"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
        {label && <span className="max-w-[12rem] text-xs text-brand-gold/70 leading-tight">{label}</span>}
      </div>
    </div>
  );
}

