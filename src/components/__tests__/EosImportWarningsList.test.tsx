import { render, screen } from "@testing-library/react";
import EosImportWarningsList from "../EosImportWarningsList";
import { EosWarning, EosWarningSeverity } from "@/generated/graphql";

const w = (code: string, message: string): EosWarning => ({
  code,
  severity: EosWarningSeverity.Info,
  message,
  context: [],
});

describe("EosImportWarningsList", () => {
  it("groups warnings by code with counts", () => {
    render(
      <EosImportWarningsList
        warnings={[
          w("EFFECT_SKIPPED", "effect 1"),
          w("EFFECT_SKIPPED", "effect 2"),
          w("SYNTHESIZED_FIXTURE", "synth"),
        ]}
      />,
    );
    expect(screen.getByText(/Effects skipped \(2\)/)).toBeInTheDocument();
    expect(screen.getByText(/Synthesized fixtures \(1\)/)).toBeInTheDocument();
  });

  it("renders nothing when warnings is empty", () => {
    const { container } = render(<EosImportWarningsList warnings={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("falls back to the raw code when no friendly name is registered", () => {
    render(
      <EosImportWarningsList
        warnings={[w("BRAND_NEW_CODE", "future warning")]}
      />,
    );
    expect(screen.getByText(/BRAND_NEW_CODE \(1\)/)).toBeInTheDocument();
  });
});
