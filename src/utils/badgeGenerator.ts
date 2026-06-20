export const generateCourseBadgeSVG = (courseTitle: string): string => {
  // Extract initials or use a short version for the badge
  const words = courseTitle.split(' ').filter(w => w.length > 2);
  const initials = words.length >= 2 
    ? `${words[0][0]}${words[1][0]}`.toUpperCase()
    : courseTitle.substring(0, 2).toUpperCase();

  // Pick a random hue for the badge based on the title length
  const hue = (courseTitle.length * 15) % 360;
  
  return `
    <svg xmlns="http://www.w3.org/AspectRatio" viewBox="0 0 200 200" width="100%" height="100%">
      <defs>
        <linearGradient id="grad_${hue}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hue}, 80%, 60%)" />
          <stop offset="100%" stop-color="hsl(${(hue + 40) % 360}, 90%, 40%)" />
        </linearGradient>
        <filter id="glow_${hue}" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFD700" />
          <stop offset="50%" stop-color="#FFA500" />
          <stop offset="100%" stop-color="#FF8C00" />
        </linearGradient>
      </defs>
      
      <!-- Outer Ring -->
      <circle cx="100" cy="100" r="90" fill="url(#grad_${hue})" filter="url(#glow_${hue})" />
      
      <!-- Inner Ring -->
      <circle cx="100" cy="100" r="75" fill="#1e1e2f" stroke="url(#gold)" stroke-width="6" />
      
      <!-- Stars -->
      <path d="M100 15 L105 30 L120 30 L108 40 L112 55 L100 45 L88 55 L92 40 L80 30 L95 30 Z" fill="url(#gold)" opacity="0.8" />
      
      <!-- Text/Initials -->
      <text x="100" y="115" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle" letter-spacing="2">
        ${initials}
      </text>
      
      <!-- Ribbon -->
      <path d="M40 160 L100 140 L160 160 L150 190 L100 175 L50 190 Z" fill="url(#gold)" />
      <text x="100" y="172" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#5c3a00" text-anchor="middle" letter-spacing="1">
        COMPLETADO
      </text>
    </svg>
  `.trim();
};
