import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** Same mark as the header: four territories in rows. */
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#14201a",
        borderRadius: 16,
      }}
    >
      <svg width="44" height="44" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M5 5h6v6H5zM13 5h6v4h-6zM13 11h6v8h-6zM5 13h6v6H5z"
          fill="#9fdba8"
        />
      </svg>
    </div>,
    size,
  );
}
