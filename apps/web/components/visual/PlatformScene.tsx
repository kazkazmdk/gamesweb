"use client";

import { useId } from "react";

/** Authored platform hero/tile art. Home still uses GameArt JPGs. */
export function PlatformScene({ slug, className = "" }: { slug: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" className={`gw-platform-scene ${className}`} aria-hidden>
      {slug === "velocity-run" ? (
        <Velocity id={id} />
      ) : slug === "swarm-protocol" ? (
        <Swarm id={id} />
      ) : slug === "sky-stack" ? (
        <Sky id={id} />
      ) : slug === "knockout-circuit" ? (
        <Knockout id={id} />
      ) : slug === "pocket-striker" ? (
        <Pocket id={id} />
      ) : slug === "territory-rush" ? (
        <Territory id={id} />
      ) : slug === "crowd-control" ? (
        <Crowd id={id} />
      ) : (
        <Neon id={id} />
      )}
    </svg>
  );
}

function Neon({ id }: { id: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#24141c" />
          <stop offset="0.42" stopColor="#120c12" />
          <stop offset="1" stopColor="#0a080c" />
        </linearGradient>
        <linearGradient id={`${id}water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#142432" />
          <stop offset="1" stopColor="#0a141c" />
        </linearGradient>
        <radialGradient id={`${id}glow`} cx="68%" cy="36%" r="46%">
          <stop offset="0" stopColor="#e35aa0" stopOpacity=".28" />
          <stop offset="1" stopColor="#e35aa0" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}road`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#262228" />
          <stop offset="1" stopColor="#161418" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}sky)`} />
      <rect width="1600" height="900" fill={`url(#${id}glow)`} />
      <rect x="0" y="520" width="1600" height="380" fill={`url(#${id}water)`} />
      <path d="M0 560 Q 220 548 400 568 T 820 552 T 1240 574 T 1600 556 L 1600 900 L 0 900 Z" fill="#0c1822" opacity=".55" />
      <g fill="#1a141c">
        <rect x="980" y="268" width="46" height="252" />
        <rect x="1040" y="210" width="70" height="310" />
        <rect x="1124" y="248" width="36" height="272" />
        <rect x="1172" y="186" width="88" height="334" />
        <rect x="1274" y="230" width="52" height="290" />
        <rect x="1340" y="164" width="74" height="356" />
        <rect x="1428" y="220" width="40" height="300" />
        <rect x="1480" y="196" width="90" height="324" />
      </g>
      <g fill="#e35aa0" opacity=".22">
        <rect x="1054" y="236" width="10" height="10" />
        <rect x="1190" y="214" width="10" height="10" />
        <rect x="1360" y="196" width="10" height="10" />
        <rect x="1510" y="228" width="10" height="10" />
        <rect x="1054" y="280" width="10" height="10" />
        <rect x="1190" y="268" width="10" height="10" />
      </g>
      <g stroke="#3a2430" strokeWidth="10" fill="none">
        <path d="M420 620 L 420 410 L 610 410" />
        <path d="M1480 640 L 1480 360 L 1320 360" />
      </g>
      <rect x="390" y="404" width="14" height="220" fill="#2a1c24" />
      <rect x="1466" y="354" width="14" height="290" fill="#2a1c24" />
      <path d="M-80 780 C 180 520, 430 840, 780 610 S 1220 390, 1720 560 L 1720 900 L -80 900 Z" fill={`url(#${id}road)`} />
      <path d="M-80 764 C 186 510, 436 826, 786 598 S 1226 378, 1720 546" fill="none" stroke="#3a2430" strokeWidth="22" />
      <path d="M-80 764 C 186 510, 436 826, 786 598 S 1226 378, 1720 546" fill="none" stroke="#e35aa0" strokeWidth="5" />
      <path d="M40 760 C 300 560, 520 800, 840 620" fill="none" stroke="#f3f1ec" strokeWidth="3" strokeDasharray="20 26" opacity=".4" />
      <g fill="#f3f1ec">
        <rect x="248" y="702" width="7" height="16" transform="rotate(-28 251 710)" />
        <rect x="430" y="688" width="7" height="16" transform="rotate(18 433 696)" />
        <rect x="980" y="548" width="7" height="16" transform="rotate(-14 983 556)" />
        <rect x="1188" y="508" width="7" height="16" transform="rotate(-22 1191 516)" />
      </g>
      <g>
        <rect x="236" y="628" width="5" height="46" fill="#f6d6a8" />
        <circle cx="238" cy="624" r="7" fill="#f6d6a8" />
        <circle cx="238" cy="624" r="14" fill="#f6d6a8" opacity=".18" />
        <rect x="1268" y="476" width="5" height="46" fill="#f6d6a8" />
        <circle cx="1270" cy="472" r="7" fill="#f6d6a8" />
        <circle cx="1270" cy="472" r="14" fill="#f6d6a8" opacity=".18" />
      </g>
      <g transform="translate(1048 528) rotate(-18)">
        <rect x="-12" y="-8" width="58" height="20" fill="#161418" />
        <rect x="-8" y="-4" width="50" height="12" fill="#f3f1ec" />
        <path d="M8 -1 L18 6 L8 8 Z" fill="#e35aa0" />
      </g>
      <g transform="translate(760 638) rotate(16)">
        <ellipse cx="0" cy="10" rx="22" ry="7" fill="#000" opacity=".35" />
        <rect x="-16" y="-8" width="32" height="16" rx="4" fill="#f3f1ec" />
        <rect x="-10" y="-4" width="12" height="6" fill="#120c12" />
        <rect x="8" y="-2" width="6" height="4" fill="#e35aa0" />
      </g>
      <path d="M0 900 L 210 690 L 360 900 Z" fill="#000" opacity=".38" />
      <path d="M1600 900 L 1380 700 L 1210 900 Z" fill="#000" opacity=".3" />
    </g>
  );
}

function Velocity({ id }: { id: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c2230" />
          <stop offset="1" stopColor="#061018" />
        </linearGradient>
        <linearGradient id={`${id}beam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8ff3ff" stopOpacity=".22" />
          <stop offset="1" stopColor="#8ff3ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}sky)`} />
      <rect x="150" y="0" width="36" height="900" fill={`url(#${id}beam)`} />
      <rect x="1414" y="0" width="28" height="900" fill={`url(#${id}beam)`} />
      <g fill="#0a1822">
        <rect x="70" y="0" width="22" height="900" />
        <rect x="1508" y="0" width="18" height="900" />
      </g>
      <g fill="#12303c">
        <rect x="320" y="70" width="960" height="20" />
        <rect x="360" y="210" width="780" height="12" />
        <rect x="420" y="340" width="520" height="10" />
      </g>
      <g fill="#3ec6e8" opacity=".16">
        <rect x="360" y="210" width="780" height="3" />
        <rect x="320" y="70" width="960" height="3" />
      </g>
      <g fill="#102834">
        <rect x="0" y="720" width="560" height="180" />
        <rect x="560" y="640" width="340" height="32" />
        <rect x="980" y="520" width="280" height="32" />
        <rect x="1320" y="430" width="200" height="26" />
      </g>
      <g fill="#1b3a48">
        <rect x="80" y="760" width="420" height="22" />
        <rect x="580" y="648" width="300" height="16" />
        <rect x="1000" y="528" width="240" height="16" />
      </g>
      <g fill="#3ec6e8">
        <rect x="708" y="608" width="20" height="32" rx="2" />
        <rect x="1418" y="548" width="16" height="86" />
      </g>
      <g fill="#8ff3ff" opacity=".7">
        <rect x="1418" y="548" width="16" height="6" />
        <rect x="708" y="608" width="20" height="4" />
      </g>
      <path d="M0 900 L 200 650 L 340 900 Z" fill="#000" opacity=".36" />
      <path d="M1600 900 L 1388 590 L 1230 900 Z" fill="#000" opacity=".3" />
    </g>
  );
}

function Swarm({ id }: { id: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${id}sky`} cx="58%" cy="44%" r="72%">
          <stop offset="0" stopColor="#3a1a14" />
          <stop offset="1" stopColor="#0a0606" />
        </radialGradient>
        <radialGradient id={`${id}glow`} cx="56%" cy="46%" r="30%">
          <stop offset="0" stopColor="#f07a3a" stopOpacity=".38" />
          <stop offset="1" stopColor="#f07a3a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}sky)`} />
      <rect width="1600" height="900" fill={`url(#${id}glow)`} />
      <g fill="#1a1012">
        <rect x="0" y="620" width="1600" height="280" />
        <rect x="560" y="120" width="64" height="340" />
        <rect x="640" y="190" width="42" height="300" />
        <rect x="1180" y="80" width="90" height="400" />
        <rect x="1288" y="140" width="52" height="340" />
      </g>
      <g fill="#f07a3a" opacity=".4">
        <rect x="576" y="156" width="14" height="14" />
        <rect x="576" y="206" width="14" height="14" />
        <rect x="1204" y="118" width="16" height="16" />
        <rect x="1204" y="168" width="16" height="16" />
      </g>
      <ellipse cx="980" cy="430" rx="390" ry="240" fill="none" stroke="#f07a3a" strokeOpacity=".2" strokeWidth="3" />
      <ellipse cx="980" cy="430" rx="250" ry="154" fill="none" stroke="#ffc18a" strokeOpacity=".16" strokeWidth="2" />
      <ellipse cx="980" cy="430" rx="78" ry="48" fill="#f07a3a" opacity=".16" />
      <g>
        <polygon points="980,392 1024,430 980,468 936,430" fill="#f3f1ec" />
        <polygon points="980,404 1004,430 980,456 956,430" fill="#1a1012" />
        <rect x="968" y="424" width="24" height="8" fill="#f07a3a" />
        <ellipse cx="980" cy="470" rx="18" ry="6" fill="#f07a3a" opacity=".45" />
      </g>
      <circle cx="740" cy="290" r="16" fill="#c45c3a" />
      <circle cx="1240" cy="268" r="11" fill="#e8b089" />
      <circle cx="1190" cy="560" r="15" fill="#f07a3a" opacity=".75" />
      <path d="M980 430 L 1180 250" stroke="#ffc18a" strokeWidth="3" opacity=".35" />
      <path d="M980 430 L 760 560" stroke="#f07a3a" strokeWidth="2" opacity=".3" />
      <path d="M0 900 L 230 640 L 390 900 Z" fill="#000" opacity=".4" />
      <path d="M1600 900 L 1390 650 L 1210 900 Z" fill="#000" opacity=".34" />
    </g>
  );
}

function Sky({ id }: { id: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7eb6de" />
          <stop offset="0.45" stopColor="#2a3e58" />
          <stop offset="1" stopColor="#101826" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}sky)`} />
      <circle cx="250" cy="130" r="78" fill="#ffd296" opacity=".28" />
      <circle cx="250" cy="130" r="46" fill="#ffe7c2" opacity=".35" />
      <ellipse cx="430" cy="196" rx="92" ry="30" fill="#fff" opacity=".16" />
      <ellipse cx="1120" cy="150" rx="130" ry="34" fill="#fff" opacity=".12" />
      <g fill="#fff" opacity=".06">
        <rect x="1160" y="410" width="86" height="300" />
        <rect x="1268" y="340" width="62" height="370" />
        <rect x="1350" y="280" width="44" height="430" />
      </g>
      <g>
        <rect x="660" y="690" width="300" height="30" rx="6" fill="#c8e4ff" />
        <rect x="720" y="648" width="230" height="30" rx="6" fill="#eaf6ff" />
        <rect x="760" y="606" width="186" height="30" rx="6" fill="#9fd6ff" />
        <rect x="800" y="564" width="146" height="30" rx="6" fill="#7ec8ff" />
      </g>
      <ellipse cx="820" cy="730" rx="150" ry="12" fill="#000" opacity=".2" />
    </g>
  );
}

function Knockout({ id }: { id: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2014" />
          <stop offset="1" stopColor="#100c08" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}sky)`} />
      <g fill="#2a2218">
        <rect x="60" y="40" width="40" height="860" />
        <rect x="124" y="160" width="24" height="740" />
        <rect x="1280" y="0" width="30" height="900" />
        <rect x="1480" y="80" width="22" height="820" />
      </g>
      <g fill="#ffb45a" opacity=".22">
        <rect x="190" y="120" width="320" height="12" />
        <rect x="190" y="160" width="220" height="8" />
        <rect x="980" y="80" width="260" height="10" />
      </g>
      <path d="M60 250 C 210 210, 300 310, 430 270" fill="none" stroke="#c48a20" strokeWidth="16" />
      <path d="M1280 180 C 1380 220, 1460 140, 1560 200" fill="none" stroke="#c48a20" strokeWidth="12" />
      <rect x="0" y="780" width="1600" height="120" fill="#1a1410" />
      <g fill="#3a2a12">
        <rect x="0" y="768" width="1600" height="16" />
        <rect x="180" y="620" width="240" height="26" />
        <rect x="500" y="540" width="200" height="26" />
        <rect x="860" y="610" width="180" height="26" />
        <rect x="1180" y="500" width="220" height="26" />
      </g>
      <g fill="#ffb703">
        <rect x="180" y="620" width="240" height="5" />
        <rect x="500" y="540" width="200" height="5" />
        <rect x="1180" y="500" width="220" height="5" />
      </g>
      <g transform="translate(900 560)">
        <rect x="-6" y="16" width="12" height="36" fill="#2a2218" />
        <rect x="-54" y="-6" width="108" height="12" fill="#ff5d4a" transform="rotate(28)" />
        <rect x="-54" y="-6" width="108" height="12" fill="#ff5d4a" transform="rotate(-28)" />
        <circle r="9" fill="#c4b48a" />
      </g>
      <rect x="1188" y="250" width="22" height="250" fill="#ffe08a" opacity=".55" />
      <g fill="#ffb45a" opacity=".28">
        <circle cx="220" cy="200" r="9" />
        <circle cx="720" cy="140" r="8" />
        <circle cx="1320" cy="120" r="10" />
      </g>
      <path d="M0 900 L 200 680 L 350 900 Z" fill="#000" opacity=".38" />
    </g>
  );
}

function Pocket({ id }: { id: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${id}room`} cx="50%" cy="40%" r="70%">
          <stop offset="0" stopColor="#1a3020" />
          <stop offset="1" stopColor="#0a1410" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}room)`} />
      <rect x="120" y="150" width="1360" height="620" rx="28" fill="#000" opacity=".35" />
      <rect x="140" y="164" width="1320" height="580" rx="24" fill="#5a3a22" />
      <rect x="176" y="200" width="1248" height="508" rx="16" fill="#173828" />
      <rect x="188" y="212" width="1224" height="484" rx="14" fill="#1f4a32" />
      <rect x="200" y="224" width="900" height="20" rx="6" fill="#fff" opacity=".06" />
      <circle cx="230" cy="250" r="22" fill="#08140c" />
      <circle cx="1370" cy="250" r="22" fill="#08140c" />
      <circle cx="230" cy="670" r="22" fill="#08140c" />
      <circle cx="1370" cy="670" r="22" fill="#08140c" />
      <circle cx="1080" cy="520" r="13" fill="#c4f1c2" />
      <circle cx="620" cy="400" r="9" fill="#f3f1ec" />
      <rect x="1248" y="232" width="86" height="24" fill="#2a2018" />
      <rect x="1258" y="238" width="24" height="12" fill="#ffd166" />
      <g fill="#c4b48a" opacity=".4">
        <circle cx="280" cy="148" r="4" />
        <circle cx="360" cy="148" r="4" />
        <circle cx="440" cy="148" r="4" />
        <circle cx="520" cy="148" r="4" />
      </g>
    </g>
  );
}

function Territory({ id }: { id: string }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${id}void`} cx="50%" cy="48%" r="70%">
          <stop offset="0" stopColor="#1a1420" />
          <stop offset="1" stopColor="#0c0a10" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}void)`} />
      <rect x="240" y="120" width="1120" height="660" fill="none" stroke="#ff4d6d" strokeOpacity=".2" strokeWidth="3" />
      <path d="M240 450 H1360 M800 120 V780" stroke="#fff" strokeOpacity=".05" />
      <rect x="800" y="450" width="280" height="190" fill="#ff4d6d" opacity=".2" />
      <rect x="800" y="450" width="280" height="8" fill="#ffc1cc" opacity=".35" />
      <rect x="500" y="280" width="200" height="150" fill="#4dabff" opacity=".14" />
      <rect x="940" y="200" width="160" height="110" fill="#ffd166" opacity=".1" />
      <circle cx="820" cy="470" r="11" fill="#ff4d6d" />
      <path d="M820 470 L 1000 520 L 1060 610" fill="none" stroke="#fff" strokeWidth="4" opacity=".5" />
      <path d="M240 120 L 270 120 L 240 150" fill="#ff4d6d" opacity=".45" />
      <path d="M1360 780 L 1330 780 L 1360 750" fill="#ff4d6d" opacity=".45" />
    </g>
  );
}

function Crowd({ id }: { id: string }) {
  return (
    <g>
      <defs>
        <linearGradient id={`${id}hall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a1812" />
          <stop offset="1" stopColor="#120a08" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}hall)`} />
      <rect x="210" y="0" width="44" height="900" fill="#3a2218" opacity=".7" />
      <rect x="1346" y="0" width="44" height="900" fill="#3a2218" opacity=".7" />
      <rect x="254" y="0" width="1092" height="900" fill="#2a1812" opacity=".45" />
      <rect x="500" y="200" width="210" height="78" fill="#2f6a3a" />
      <rect x="880" y="200" width="210" height="78" fill="#6a2a28" />
      <rect x="572" y="226" width="28" height="8" fill="#f3f1ec" opacity=".55" />
      <rect x="584" y="214" width="8" height="32" fill="#f3f1ec" opacity=".55" />
      <ellipse cx="620" cy="770" rx="340" ry="86" fill="#ff7a59" opacity=".18" />
      <ellipse cx="620" cy="742" rx="260" ry="56" fill="#ff6a42" opacity=".28" />
      <g fill="#ff8a62">
        <circle cx="500" cy="710" r="11" />
        <circle cx="540" cy="698" r="13" />
        <circle cx="584" cy="712" r="12" />
        <circle cx="626" cy="696" r="14" />
        <circle cx="670" cy="710" r="11" />
        <circle cx="712" cy="700" r="12" />
        <circle cx="754" cy="714" r="10" />
      </g>
    </g>
  );
}
