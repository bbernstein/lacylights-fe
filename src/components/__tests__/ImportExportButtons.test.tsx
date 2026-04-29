import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import ImportExportButtons from "../ImportExportButtons";
import {
  IMPORT_PROJECT_FROM_EOS,
  EXPORT_PROJECT_TO_EOS,
} from "@/graphql/projects";

/**
 * Spy on document.createElement so the dynamically created file <input> is
 * captured (the component never appends it to the DOM, so it can't be queried
 * the usual way) and so input.click() doesn't try to open the native picker.
 */
function captureFileInput() {
  const realCreate = document.createElement.bind(document);
  let capturedInput: HTMLInputElement | null = null;
  const spy = jest
    .spyOn(document, "createElement")
    .mockImplementation((tag: string) => {
      const el = realCreate(tag);
      if (tag === "input") {
        capturedInput = el as HTMLInputElement;
        (el as HTMLInputElement).click = jest.fn();
      }
      return el;
    });
  return {
    spy,
    getInput: () => capturedInput,
  };
}

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

    const { spy: createSpy, getInput } = captureFileInput();

    try {
      const onImportComplete = jest.fn();
      render(
        <MockedProvider mocks={[importMock]} addTypename={false}>
          <ImportExportButtons onImportComplete={onImportComplete} />
        </MockedProvider>,
      );

      fireEvent.click(screen.getByRole("button", { name: /import/i }));
      fireEvent.click(screen.getByText(/ETC Eos \(\.asc\)/));

      const capturedInput = getInput();
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

  it("renders the warnings panel after a successful Eos import", async () => {
    const ascii = "Ident 3:0\n";
    const importMock = {
      request: {
        query: IMPORT_PROJECT_FROM_EOS,
        variables: { asciiContent: ascii, options: { newProjectName: "show" } },
      },
      result: {
        data: {
          importProjectFromEos: {
            projectId: "p99",
            fixtureDefinitionsCount: 0,
            fixtureInstancesCount: 0,
            looksCount: 0,
            cueListsCount: 0,
            cuesCount: 0,
            groupsCount: 0,
            warnings: [
              {
                code: "EFFECT_SKIPPED",
                severity: "INFO",
                message: "Effect FX1 skipped",
                context: [],
              },
              {
                code: "EFFECT_SKIPPED",
                severity: "INFO",
                message: "Effect FX2 skipped",
                context: [],
              },
            ],
            synthesizedDefinitionIds: [],
          },
        },
      },
    };

    const { spy: createSpy, getInput } = captureFileInput();

    try {
      render(
        <MockedProvider mocks={[importMock]} addTypename={false}>
          <ImportExportButtons />
        </MockedProvider>,
      );
      fireEvent.click(screen.getByRole("button", { name: /import/i }));
      fireEvent.click(screen.getByText(/ETC Eos \(\.asc\)/));
      const capturedInput = getInput();
      expect(capturedInput).not.toBeNull();
      const file = new File([ascii], "show.asc", { type: "text/plain" });
      file.text = jest.fn().mockResolvedValue(ascii);
      Object.defineProperty(capturedInput, "files", {
        value: [file],
        configurable: true,
      });
      fireEvent.change(capturedInput!);

      await waitFor(() =>
        expect(screen.getByText(/Effects skipped \(2\)/)).toBeInTheDocument(),
      );

      // Dismiss button removes the panel.
      fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
      await waitFor(() =>
        expect(
          screen.queryByText(/Effects skipped \(2\)/),
        ).not.toBeInTheDocument(),
      );
    } finally {
      createSpy.mockRestore();
    }
  });

  it("exports an .asc file via the browser download path and renders warnings", async () => {
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

  it("ignores a hostile backend filenameSuffix and downloads as .asc", async () => {
    const exportMock = {
      request: {
        query: EXPORT_PROJECT_TO_EOS,
        variables: { projectId: "p1" },
      },
      result: {
        data: {
          exportProjectToEos: {
            projectId: "p1",
            projectName: "Show",
            asciiContent: "Ident 3:0\n",
            // Malicious / unexpected suffix; the component must reject it.
            filenameSuffix: "/../etc/passwd",
            warnings: [],
          },
        },
      },
    };

    let capturedFilename: string | null = null;
    const realCreate = document.createElement.bind(document);
    const createSpy = jest
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        const el = realCreate(tag);
        if (tag === "a") {
          (el as HTMLAnchorElement).click = jest.fn();
          // Intercept .download assignment so we can assert on it.
          Object.defineProperty(el, "download", {
            set(value: string) {
              capturedFilename = value;
            },
            get() {
              return capturedFilename ?? "";
            },
            configurable: true,
          });
        }
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

      await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
      expect(capturedFilename).toBe("Show.asc");
    } finally {
      createSpy.mockRestore();
      URL.createObjectURL = originalCreateURL;
      URL.revokeObjectURL = originalRevokeURL;
    }
  });
});
