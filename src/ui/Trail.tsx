export function Trail() {
  return <svg className="trail-art" viewBox="0 0 480 160" aria-hidden="true">
      <defs>
        <pattern id="paper-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M16 0H0v16" fill="none" stroke="currentColor" strokeWidth=".38" />
        </pattern>
      </defs>
      <rect width="480" height="160" fill="url(#paper-grid)" opacity=".38" />
      <g fill="none" stroke="currentColor" strokeWidth=".75" opacity=".55">{Array.from({
        length: 11
      }, (_, i) => <path key={i} transform={`translate(${i * 3} ${i * 5})`} d="M-45 89C20 41 65 149 131 101S190 124 237 69s80-94 125-70 60-33 148-32" />)}</g>
      <g fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="3 5">
        <path d="M43 136Q111 61 171 88T292 47 415 27" />
      </g>
      <g fill="var(--brand)" stroke="var(--surface)" strokeWidth="3">{[[93, 99], [214, 85], [328, 41]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="5" />)}</g>
      <path d="M416 29V8l16 4-16 6" fill="none" stroke="var(--brand)" strokeWidth="2" />
    </svg>;
}
