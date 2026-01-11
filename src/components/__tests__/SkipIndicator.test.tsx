import { render, screen } from "@testing-library/react";
import { SkipIndicator } from "../SkipIndicator";

describe("SkipIndicator", () => {
  describe("rendering", () => {
    it("renders with default small size", () => {
      render(<SkipIndicator />);

      const indicator = screen.getByRole("img", { name: "Skip indicator" });
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveAttribute("title", "Skipped during playback");
    });

    it("renders with small size when specified", () => {
      render(<SkipIndicator size="sm" />);

      const indicator = screen.getByRole("img", { name: "Skip indicator" });
      const svg = indicator.querySelector("svg");
      expect(svg).toHaveClass("w-3", "h-3", "inline");
    });

    it("renders with medium size when specified", () => {
      render(<SkipIndicator size="md" />);

      const indicator = screen.getByRole("img", { name: "Skip indicator" });
      const svg = indicator.querySelector("svg");
      expect(svg).toHaveClass("w-4", "h-4");
      expect(svg).not.toHaveClass("inline");
    });

    it("applies custom className", () => {
      render(<SkipIndicator className="ml-2 custom-class" />);

      const indicator = screen.getByRole("img", { name: "Skip indicator" });
      expect(indicator).toHaveClass("ml-2", "custom-class");
    });

    it("has correct default styling", () => {
      render(<SkipIndicator />);

      const indicator = screen.getByRole("img", { name: "Skip indicator" });
      expect(indicator).toHaveClass("text-gray-400", "dark:text-gray-500");
    });
  });

  describe("accessibility", () => {
    it("has proper role and aria-label", () => {
      render(<SkipIndicator />);

      const indicator = screen.getByRole("img", { name: "Skip indicator" });
      expect(indicator).toBeInTheDocument();
    });

    it("has title for tooltip", () => {
      render(<SkipIndicator />);

      const indicator = screen.getByRole("img", { name: "Skip indicator" });
      expect(indicator).toHaveAttribute("title", "Skipped during playback");
    });

    it("has aria-hidden on svg", () => {
      render(<SkipIndicator />);

      const indicator = screen.getByRole("img", { name: "Skip indicator" });
      const svg = indicator.querySelector("svg");
      expect(svg).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("SVG structure", () => {
    it("renders svg with correct viewBox", () => {
      render(<SkipIndicator />);

      const indicator = screen.getByRole("img", { name: "Skip indicator" });
      const svg = indicator.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    });

    it("renders svg with no fill and currentColor stroke", () => {
      render(<SkipIndicator />);

      const indicator = screen.getByRole("img", { name: "Skip indicator" });
      const svg = indicator.querySelector("svg");
      expect(svg).toHaveAttribute("fill", "none");
      expect(svg).toHaveAttribute("stroke", "currentColor");
    });

    it("renders path with correct attributes", () => {
      render(<SkipIndicator />);

      const indicator = screen.getByRole("img", { name: "Skip indicator" });
      const path = indicator.querySelector("path");
      expect(path).toHaveAttribute("stroke-linecap", "round");
      expect(path).toHaveAttribute("stroke-linejoin", "round");
      expect(path).toHaveAttribute("stroke-width", "2");
      expect(path).toHaveAttribute("d", "M13 5l7 7-7 7M5 5l7 7-7 7");
    });
  });
});
