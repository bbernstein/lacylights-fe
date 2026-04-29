import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import ImportExportButtons from "../ImportExportButtons";
import {
  IMPORT_PROJECT_FROM_EOS,
  EXPORT_PROJECT_TO_EOS,
} from "@/graphql/projects";

describe("ImportExportButtons - Eos format", () => {
  it("offers ETC Eos in the import dropdown", () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <ImportExportButtons />
      </MockedProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /import/i }));
    expect(screen.getByText(/ETC Eos \(\.asc\)/)).toBeInTheDocument();
  });

  it("offers ETC Eos in the export dropdown when a project is selected", () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <ImportExportButtons projectId="p1" exportOnly />
      </MockedProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /export/i }));
    expect(screen.getByText(/ETC Eos \(\.asc\)/)).toBeInTheDocument();
  });

  it("imports an Eos .asc file and reports completion", async () => {
    const ascii = "Ident 3:0\n";
    const importMock = {
      request: {
        query: IMPORT_PROJECT_FROM_EOS,
        variables: {
          asciiContent: ascii,
          options: { newProjectName: "show" },
        },
      },
      result: {
        data: {
          importProjectFromEos: {
            projectId: "p42",
            fixtureDefinitionsCount: 0,
            fixtureInstancesCount: 0,
            looksCount: 0,
            cueListsCount: 0,
            cuesCount: 0,
            groupsCount: 0,
            warnings: [],
            synthesizedDefinitionIds: [],
          },
        },
      },
    };

    // Capture the file input the component creates dynamically.
    const realCreate = document.createElement.bind(document);
    let capturedInput: HTMLInputElement | null = null;
    const createSpy = jest
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        const el = realCreate(tag);
        if (tag === "input") {
          capturedInput = el as HTMLInputElement;
          // Suppress the native file picker that input.click() would trigger.
          (el as HTMLInputElement).click = jest.fn();
        }
        return el;
      });

    try {
      const onImportComplete = jest.fn();
      render(
        <MockedProvider mocks={[importMock]} addTypename={false}>
          <ImportExportButtons onImportComplete={onImportComplete} />
        </MockedProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: /import/i }));
      fireEvent.click(screen.getByText(/ETC Eos \(\.asc\)/));

      expect(capturedInput).not.toBeNull();
      const file = new File([ascii], "show.asc", { type: "text/plain" });
      // jsdom's File doesn't implement .text(); polyfill on the instance.
      file.text = jest.fn().mockResolvedValue(ascii);
      Object.defineProperty(capturedInput, "files", {
        value: [file],
        configurable: true,
      });
      fireEvent.change(capturedInput!);

      await waitFor(() => {
        expect(onImportComplete).toHaveBeenCalledWith("p42");
      });
    } finally {
      createSpy.mockRestore();
    }
  });

  it("exports an .asc file with the suffix from the backend", async () => {
    const exportMock = {
      request: {
        query: EXPORT_PROJECT_TO_EOS,
        variables: { projectId: "p1" },
      },
      result: {
        data: {
          exportProjectToEos: {
            projectId: "p1",
            projectName: "Show One",
            asciiContent: "Ident 3:0\n",
            filenameSuffix: ".asc",
            warnings: [
              {
                code: "EFFECT_SKIPPED",
                severity: "INFO",
                message: "Effect FX42 skipped",
                context: [],
              },
            ],
          },
        },
      },
    };

    // Stub URL methods used by the browser download path. jsdom doesn't
    // ship implementations of these, so assign mocks directly.
    const realCreate = document.createElement.bind(document);
    const createSpy = jest
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        const el = realCreate(tag);
        if (tag === "a") (el as HTMLAnchorElement).click = jest.fn();
        return el;
      });
    const originalCreateURL = URL.createObjectURL;
    const originalRevokeURL = URL.revokeObjectURL;
    URL.createObjectURL = jest.fn(() => "blob:mock");
    URL.revokeObjectURL = jest.fn();

    try {
      render(
        <MockedProvider mocks={[exportMock]} addTypename={false}>
          <ImportExportButtons projectId="p1" exportOnly />
        </MockedProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: /export/i }));
      fireEvent.click(screen.getByText(/ETC Eos \(\.asc\)/));

      await waitFor(() =>
        expect(screen.getByText(/Effects skipped \(1\)/)).toBeInTheDocument(),
      );
      expect(URL.createObjectURL).toHaveBeenCalled();
    } finally {
      createSpy.mockRestore();
      URL.createObjectURL = originalCreateURL;
      URL.revokeObjectURL = originalRevokeURL;
    }
  });
});
