/**
 * Feeds the pointer position into `.liquid` elements as --mx / --my, so their
 * glass highlight follows the finger or cursor (see the `liquid` utility in
 * index.css). One passive listener for the whole page.
 */
export function installLiquidPointer(): void {
  let frame = 0;
  let pending: PointerEvent | null = null;

  const update = () => {
    frame = 0;
    const event = pending;
    if (!event) return;
    const target = (event.target as Element | null)?.closest?.(".liquid") as HTMLElement | null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    target.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    target.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  const onPointer = (event: PointerEvent) => {
    pending = event;
    if (!frame) frame = requestAnimationFrame(update);
  };

  document.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("pointerdown", onPointer, { passive: true });
}
