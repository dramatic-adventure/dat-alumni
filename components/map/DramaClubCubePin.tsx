// Isometric cube pin for Drama Club map markers.
// DAT purple (#6C00AF) with lighter top and darker right face for depth.
// Exported both as a React component and as a raw HTML string for Mapbox DOM markers.

export const DRAMA_CUBE_SVG_HTML =
  `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
  `<polygon points="18,2 33,10 18,18 3,10" fill="#9B3FE4" stroke="#2E0050" stroke-width="0.6"/>` +
  `<polygon points="3,10 18,18 18,34 3,26" fill="#6C00AF" stroke="#2E0050" stroke-width="0.6"/>` +
  `<polygon points="18,18 33,10 33,26 18,34" fill="#46006F" stroke="#2E0050" stroke-width="0.6"/>` +
  `</svg>`;

export default function DramaClubCubePin({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <polygon points="18,2 33,10 18,18 3,10" fill="#9B3FE4" stroke="#2E0050" strokeWidth="0.6" />
      <polygon points="3,10 18,18 18,34 3,26" fill="#6C00AF" stroke="#2E0050" strokeWidth="0.6" />
      <polygon points="18,18 33,10 33,26 18,34" fill="#46006F" stroke="#2E0050" strokeWidth="0.6" />
    </svg>
  );
}
