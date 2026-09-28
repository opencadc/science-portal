import type { SVGProps } from 'react';

const GOLD = '#ffc83c';

type Node = { cx: number; cy: number; r: number };

const NODES: Node[] = [
  { cx: 10, cy: 32, r: 7.2 },
  { cx: 18.5, cy: 24, r: 4.8 },
  { cx: 18.5, cy: 40, r: 4.8 },
  { cx: 28, cy: 15, r: 5 },
  { cx: 28, cy: 49, r: 5 },
  { cx: 38, cy: 7, r: 6.6 },
  { cx: 38, cy: 57, r: 6.6 },
];

function diamond(cx: number, cy: number, r: number) {
  return `${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`;
}

export function CanfarMark({
  height = 40,
  title,
  ...props
}: SVGProps<SVGSVGElement> & { height?: number; title?: string }) {
  const labelled = Boolean(title);

  return (
    <svg
      viewBox="0 0 46 64"
      height={height}
      fill="none"
      style={{ display: 'block', width: 'auto' }}
      role={labelled ? 'img' : undefined}
      aria-hidden={labelled ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <path
        d="M17.2 32H38M18.5 24V40M28 15H38M28 49H38M38 7V57"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="square"
      />
      {NODES.map((node) => (
        <polygon
          key={`${node.cx}-${node.cy}`}
          points={diamond(node.cx, node.cy, node.r)}
          fill={GOLD}
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="miter"
        />
      ))}
    </svg>
  );
}
