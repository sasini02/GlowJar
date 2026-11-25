import type { SVGProps } from "react";

/**
 * Single-colour Glowjar mark (design/icons/glowjar-mark.svg). Inherits currentColor.
 * The stroke width is fixed because the mark is drawn on a 64px grid, so the
 * 1.75 Lucide stroke passed by nav icons would make it look hairline.
 */
export function JarMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="22" y="5" width="20" height="7" rx="2.5" fill="currentColor" stroke="none" />
      <path d="M24 15H40V18C40 20.5 49 22.5 49 29V49C49 54 45 58 40 58H24C19 58 15 54 15 49V29C15 22.5 24 20.5 24 18Z" />
      <path d="M33.5 32.5A9 9 0 1 0 38 46a7 7 0 1 1-4.5-13.5Z" fill="currentColor" stroke="none" />
      <path d="M40.5 25.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" fill="currentColor" stroke="none" />
    </svg>
  );
}
