interface QuestWorldBackgroundProps {
  darkMode?: boolean;
}

/** Decorative, responsive landscape used behind the Study Quest and quiz screens. */
export default function QuestWorldBackground({ darkMode = false }: QuestWorldBackgroundProps) {
  const skyTop = darkMode ? "var(--surface-page-dark)" : "var(--brand-light)";
  const cloud = darkMode ? "#D2E2E2" : "#FFFFFF";
  const hillFar = darkMode ? "var(--surface-raised-dark)" : "#E0E0E0";
  const hillNear = darkMode ? "var(--surface-card-dark)" : "#D5D5D5";
  const hillFront = darkMode ? "var(--surface-page-dark)" : "#CACACA";
  const water = darkMode ? "var(--surface-raised-dark)" : "var(--brand-soft)";

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
    >
      <defs>
        <filter id="quest-cloud-shadow" x="-20%" y="-30%" width="140%" height="170%">
          <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="var(--brand-primary)" floodOpacity={darkMode ? "0.1" : "0.14"} />
        </filter>
      </defs>

      <rect width="1440" height="900" fill={skyTop} />
      <circle cx="1160" cy="175" r="112" fill="#FFF4A8" opacity="0.4" />
      <circle cx="1160" cy="175" r="40" fill="#FFE27C" opacity="0.88" />

      <g fill={cloud} opacity={darkMode ? "0.62" : "0.9"} filter="url(#quest-cloud-shadow)">
        <path d="M-70 270c0-36 29-65 65-65 8-43 46-75 91-75 36 0 67 20 82 50 10-6 22-10 35-10 39 0 70 31 70 70s-31 70-70 70H-5c-36 0-65-29-65-65Z" />
        <path d="M1035 302c0-30 24-54 54-54 7-36 39-63 77-63 30 0 56 17 69 42 9-5 19-8 29-8 33 0 59 26 59 59s-26 59-59 59h-175c-30 0-54-24-54-54Z" />
        <path d="M340 398c0-20 16-36 36-36 5-24 26-42 52-42 20 0 38 11 46 28 6-3 13-5 20-5 22 0 40 18 40 40s-18 40-40 40H376c-20 0-36-16-36-36Z" opacity="0.55" />
      </g>

      <g fill="#FFF5B2" opacity="0.9">
        <path d="m260 180 7 16 16 7-16 7-7 16-7-16-16-7 16-7z" />
        <path d="m760 250 5 11 11 5-11 5-5 11-5-11-11-5 11-5z" />
        <circle cx="520" cy="145" r="4" />
        <circle cx="915" cy="330" r="3" />
        <circle cx="1320" cy="390" r="4" />
      </g>

      <path d="M0 645c120-58 236-45 350 5 112-77 244-66 354 9 126-75 260-62 372 7 122-65 243-54 364 6v228H0Z" fill={hillFar} />
      <path d="M0 718c140-77 260-56 388 16 132-96 278-73 406 6 125-85 268-68 390 11 95-59 178-59 256-16v165H0Z" fill={hillNear} />
      <path d="M0 795c177-79 330-47 472 24 145-75 270-45 407 21 175-91 361-48 561 12v83H0Z" fill={hillFront} />

      <path d="M1600 525C1515 526 1485 568 1410 598c-101 40-106 51-87 82 19 32 9 53-57 88-62 33-114 70-176 132h510Z" fill={water} opacity="0.95" />
      <path d="M1600 559C1512 571 1482 611 1407 639 1316 673 1290 687 1315 726 1339 765 1306 788 1239 824 1191 850 1146 878 1096 925" fill="none" stroke="#C8F3EA" strokeWidth="9" strokeLinecap="round" opacity="0.68" />

      <g stroke="#557F43" strokeWidth="5" strokeLinecap="round" opacity="0.8">
        <path d="M220 817v-51" />
        <path d="M220 790c-23-17-36-15-45-5 16 17 29 19 45 5Z" fill="#B4D88C" />
        <path d="M220 780c20-20 35-21 45-11-14 19-28 23-45 11Z" fill="#8DCB75" />
        <path d="M1170 795v-38" />
        <path d="M1170 778c-19-15-31-13-38-4 14 15 25 17 38 4Z" fill="#B4D88C" />
        <path d="M1170 767c16-16 29-18 37-10-12 16-23 19-37 10Z" fill="#8DCB75" />
      </g>

      <g fill="#FFF4D5" opacity="0.95">
        <circle cx="160" cy="835" r="7" /><circle cx="174" cy="835" r="7" /><circle cx="167" cy="824" r="7" />
        <circle cx="1260" cy="816" r="6" /><circle cx="1272" cy="816" r="6" /><circle cx="1266" cy="806" r="6" />
      </g>
      <g fill="#E98975">
        <circle cx="167" cy="835" r="4" /><circle cx="1266" cy="816" r="3.5" />
      </g>
    </svg>
  );
}
