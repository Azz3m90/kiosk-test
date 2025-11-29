'use client';

interface FlagIconProps {
  width?: number;
  height?: number;
  className?: string;
}

// United Kingdom Flag (English)
export function UKFlag({ width = 40, height = 30, className = '' }: FlagIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 30"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="English"
    >
      {/* Blue background */}
      <rect width="60" height="30" fill="#012169" />
      
      {/* White diagonal crosses */}
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="white" strokeWidth="6" />
      
      {/* Red diagonal crosses */}
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" strokeDasharray="30,30" />
      
      {/* White cross */}
      <path d="M30,0 L30,30 M0,15 L60,15" stroke="white" strokeWidth="10" />
      
      {/* Red cross */}
      <path d="M30,0 L30,30 M0,15 L60,15" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
}

// French Flag
export function FrenchFlag({ width = 40, height = 30, className = '' }: FlagIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 30"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Français"
    >
      <rect width="20" height="30" fill="#002395" />
      <rect x="20" width="20" height="30" fill="#FFFFFF" />
      <rect x="40" width="20" height="30" fill="#ED2939" />
    </svg>
  );
}

// Netherlands Flag
export function DutchFlag({ width = 40, height = 30, className = '' }: FlagIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 30"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Nederlands"
    >
      <rect width="60" height="10" fill="#AE1C28" />
      <rect y="10" width="60" height="10" fill="#FFFFFF" />
      <rect y="20" width="60" height="10" fill="#21468B" />
    </svg>
  );
}

// German Flag
export function GermanFlag({ width = 40, height = 30, className = '' }: FlagIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 30"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Deutsch"
    >
      <rect width="60" height="10" fill="#000000" />
      <rect y="10" width="60" height="10" fill="#DD0000" />
      <rect y="20" width="60" height="10" fill="#FFCE00" />
    </svg>
  );
}

// Spanish Flag
export function SpanishFlag({ width = 40, height = 30, className = '' }: FlagIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 30"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Español"
    >
      <rect width="60" height="30" fill="#AA151B" />
      <rect y="7.5" width="60" height="15" fill="#F1BF00" />
    </svg>
  );
}

// Italian Flag
export function ItalianFlag({ width = 40, height = 30, className = '' }: FlagIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 60 30"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Italiano"
    >
      <rect width="20" height="30" fill="#009246" />
      <rect x="20" width="20" height="30" fill="#FFFFFF" />
      <rect x="40" width="20" height="30" fill="#CE2B37" />
    </svg>
  );
}

// Export a mapping object for easy access
export const FlagIcons = {
  en: UKFlag,
  fr: FrenchFlag,
  nl: DutchFlag,
  de: GermanFlag,
  es: SpanishFlag,
  it: ItalianFlag,
} as const;