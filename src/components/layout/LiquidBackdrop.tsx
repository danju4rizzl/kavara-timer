/**
 * Soft, slowly drifting color fields behind the UI. Liquid glass needs
 * something colorful behind it to refract; these follow the active theme.
 */
export function LiquidBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -left-[20%] -top-[10%] h-[55vh] w-[80vw] rounded-full opacity-45 blur-[70px] transition-[background-color] duration-700"
        style={{ backgroundColor: "var(--blob-1)", animation: "drift-a 26s ease-in-out infinite" }}
      />
      <div
        className="absolute -right-[25%] top-[30%] h-[50vh] w-[75vw] rounded-full opacity-35 blur-[80px] transition-[background-color] duration-700"
        style={{ backgroundColor: "var(--blob-2)", animation: "drift-b 32s ease-in-out infinite" }}
      />
      <div
        className="absolute -bottom-[15%] left-[10%] h-[40vh] w-[70vw] rounded-full opacity-30 blur-[80px] transition-[background-color] duration-700"
        style={{ backgroundColor: "var(--blob-3)", animation: "drift-c 38s ease-in-out infinite" }}
      />
      {/* Fine grain keeps large gradients from banding. */}
      <div
        className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}
