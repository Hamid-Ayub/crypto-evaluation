type Props = {
  avatar: string;
  symbol: string;
  size?: "sm" | "md" | "lg";
};

const SIZE_MAP = {
  sm: "h-6 w-6 text-sm",
  md: "h-8 w-8 text-2xl",
  lg: "h-12 w-12 text-4xl",
};

export default function TokenAvatar({ avatar, symbol, size = "md" }: Props) {
  const isUrl = avatar.startsWith("http://") || avatar.startsWith("https://");
  
  if (isUrl) {
    return (
      <div className="relative">
        <img
          src={avatar}
          alt={symbol}
          className={`${SIZE_MAP[size]} rounded-full object-cover`}
          onError={(e) => {
            // Fallback to emoji if image fails to load
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.parentElement?.querySelector(".avatar-fallback");
            if (fallback) {
              (fallback as HTMLElement).style.display = "block";
            }
          }}
        />
        <span className={`${SIZE_MAP[size]} avatar-fallback hidden`} aria-hidden="true">
          {avatar.replace(/^https?:\/\//, "").charAt(0).toUpperCase() || symbol.charAt(0)}
        </span>
      </div>
    );
  }

  return <span className={SIZE_MAP[size]}>{avatar}</span>;
}

