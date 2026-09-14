import { ImageResponse } from "next/og";
import { brand } from "@gamesweb/config";

export const runtime = "edge";
export const alt = "Gamesweb";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0c0c0d",
          color: "#f3f1ec",
          padding: 80,
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 8, textTransform: "uppercase", opacity: 0.5 }}>browser arcade</div>
        <div style={{ fontSize: 92, letterSpacing: -4 }}>{brand.wordmark}</div>
        <div style={{ fontSize: 28, opacity: 0.7, marginTop: 12 }}>{brand.tagline}</div>
      </div>
    ),
    { ...size },
  );
}
