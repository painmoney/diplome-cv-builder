import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TiltCard from "../TiltCard";

function mockMatchMedia({ reducedMotion = false, coarsePointer = false } = {}) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches:
      (query === "(prefers-reduced-motion: reduce)" && reducedMotion) ||
      (query === "(pointer: coarse)" && coarsePointer),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function mockCardBounds(card) {
  vi.spyOn(card, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 100,
    height: 100,
    right: 100,
    bottom: 100,
    x: 0,
    y: 0,
    toJSON: () => {},
  });
}

describe("TiltCard", () => {
  beforeEach(() => {
    mockMatchMedia();
    vi.stubGlobal("requestAnimationFrame", (callback) => {
      callback();
      return 1;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders its children", () => {
    render(<TiltCard>Содержимое карточки</TiltCard>);
    expect(screen.getByText("Содержимое карточки")).toBeTruthy();
  });

  it("does not tilt when reduced motion is requested", () => {
    mockMatchMedia({ reducedMotion: true });
    render(<TiltCard data-testid="tilt-card">Карточка</TiltCard>);
    const card = screen.getByTestId("tilt-card");

    fireEvent.pointerMove(card, { clientX: 90, clientY: 10, pointerType: "mouse" });

    expect(card.style.transform).toContain("rotateX(0deg)");
    expect(card.style.transform).toContain("rotateY(0deg)");
  });

  it("does not tilt for a coarse pointer", () => {
    mockMatchMedia({ coarsePointer: true });
    render(<TiltCard data-testid="tilt-card">Карточка</TiltCard>);
    const card = screen.getByTestId("tilt-card");

    fireEvent.pointerMove(card, { clientX: 90, clientY: 10, pointerType: "mouse" });

    expect(card.style.transform).toContain("rotateX(0deg)");
    expect(card.style.transform).toContain("rotateY(0deg)");
  });

  it("tilts toward the pointer on a supported device", () => {
    render(<TiltCard data-testid="tilt-card">Карточка</TiltCard>);
    const card = screen.getByTestId("tilt-card");
    mockCardBounds(card);

    fireEvent.pointerMove(card, { clientX: 90, clientY: 10, pointerType: "mouse" });

    expect(card.style.transform).not.toContain("rotateX(0deg) rotateY(0deg)");
    expect(card.style.transform).toContain("scale(1.012)");
  });

  it("returns to its resting transform after pointer leave", () => {
    render(<TiltCard data-testid="tilt-card">Карточка</TiltCard>);
    const card = screen.getByTestId("tilt-card");
    mockCardBounds(card);

    fireEvent.pointerMove(card, { clientX: 90, clientY: 10, pointerType: "mouse" });
    fireEvent.pointerLeave(card);

    expect(card.style.transform).toContain("rotateX(0deg)");
    expect(card.style.transform).toContain("rotateY(0deg)");
    expect(card.style.transform).toContain("scale(1)");
  });

  it("works without a spotlight", () => {
    const { container } = render(
      <TiltCard spotlight={false}>Карточка</TiltCard>
    );

    expect(container.querySelector(".TiltCard-spotlight")).toBeNull();
    expect(screen.getByText("Карточка")).toBeTruthy();
  });
});
