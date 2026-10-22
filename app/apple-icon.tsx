import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

/** Home-screen icon for iOS: same mark as app/icon.svg, full-bleed (iOS rounds the corners). */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 50%, #10b981 100%)',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 44l13-13 10 8 16-18" />
          <path d="M40 21h12v12" />
        </svg>
      </div>
    ),
    size,
  );
}
