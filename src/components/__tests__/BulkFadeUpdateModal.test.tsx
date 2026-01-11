import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MockedProvider } from "@apollo/client/testing";
import BulkFadeUpdateModal from "../BulkFadeUpdateModal";
import { BULK_UPDATE_CUES } from "../../graphql/cueLists";
import { Cue, Scene } from "../../types";

// Mock useIsMobile hook
jest.mock("@/hooks/useMediaQuery", () => ({
  useIsMobile: jest.fn(() => false), // Default to desktop
}));

import { useIsMobile } from "@/hooks/useMediaQuery";

const mockUseIsMobile = useIsMobile as jest.Mock;

const mockSelectedCues: Cue[] = [
  {
    id: "1",
    name: "Cue 1",
    scene: { id: "scene-1", name: "Scene 1" } as Scene,
    cueNumber: 0,
    fadeInTime: 3,
    fadeOutTime: 3,
    followTime: undefined,
    notes: undefined,
    skip: false,
  },
  {
    id: "2",
    name: "Cue 2",
    scene: { id: "scene-2", name: "Scene 2" } as Scene,
    cueNumber: 1,
    fadeInTime: 2,
    fadeOutTime: 2,
    followTime: 1,
    notes: undefined,
    skip: false,
  },
];

const mockOnClose = jest.fn();
const mockOnUpdate = jest.fn();

const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  selectedCues: mockSelectedCues,
  onUpdate: mockOnUpdate,
};

describe("BulkFadeUpdateModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false); // Default to desktop
  });

  describe("rendering", () => {
    it("renders modal when isOpen is true", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      expect(screen.getByText("Bulk Update Fade Times")).toBeInTheDocument();
      expect(
        screen.getByText("Update timing for 2 selected cues"),
      ).toBeInTheDocument();
    });

    it("returns null when isOpen is false", () => {
      const { container } = render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} isOpen={false} />
        </MockedProvider>,
      );

      expect(container.firstChild).toBeNull();
    });

    it("renders all timing controls", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      expect(
        screen.getByLabelText("Fade In Time (seconds)"),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Fade Out Time (seconds)"),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText("Follow Time (seconds)"),
      ).toBeInTheDocument();
    });

    it("renders action buttons", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Update Cues")).toBeInTheDocument();
    });

    it("renders help text for follow time", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      expect(
        screen.getByText(
          "Leave follow time empty to clear auto-follow on selected cues",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("checkbox interaction", () => {
    it("enables fade in input when checkbox is checked", async () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Fade In Time (seconds)");
      const input = screen.getAllByPlaceholderText("3.0")[0];

      expect(input).toBeDisabled();

      await userEvent.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(input).not.toBeDisabled();
    });

    it("enables fade out input when checkbox is checked", async () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Fade Out Time (seconds)");
      const input = screen.getAllByPlaceholderText("3.0")[1];

      expect(input).toBeDisabled();

      await userEvent.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(input).not.toBeDisabled();
    });

    it("enables follow input when checkbox is checked", async () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Follow Time (seconds)");
      const input = screen.getByPlaceholderText("0.0");

      expect(input).toBeDisabled();

      await userEvent.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(input).not.toBeDisabled();
    });

    it("updates submit button state based on checkboxes", async () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const _submitButton = screen.getByText("Update Cues");
      const fadeInCheckbox = screen.getByLabelText("Fade In Time (seconds)");

      expect(_submitButton).toBeDisabled();

      await userEvent.click(fadeInCheckbox);

      expect(_submitButton).not.toBeDisabled();
    });
  });

  describe("input interaction", () => {
    it("updates fade in time value", async () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Fade In Time (seconds)");
      const input = screen.getAllByPlaceholderText("3.0")[0];

      await userEvent.click(checkbox);
      await userEvent.type(input, "5.5");

      expect(input).toHaveValue(5.5);
    });

    it("updates fade out time value", async () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Fade Out Time (seconds)");
      const input = screen.getAllByPlaceholderText("3.0")[1];

      await userEvent.click(checkbox);
      await userEvent.type(input, "2.5");

      expect(input).toHaveValue(2.5);
    });

    it("updates follow time value", async () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Follow Time (seconds)");
      const input = screen.getByPlaceholderText("0.0");

      await userEvent.click(checkbox);
      await userEvent.type(input, "1.0");

      expect(input).toHaveValue(1.0);
    });
  });

  describe("form validation", () => {
    it("shows error when no checkboxes are selected", async () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const form = document.getElementById("bulk-fade-update-form");
      fireEvent.submit(form!);

      expect(
        screen.getByText("Please select at least one timing to update"),
      ).toBeInTheDocument();
    });

    it("shows error for invalid fade in time", async () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Fade In Time (seconds)");
      const input = screen.getAllByPlaceholderText("3.0")[0];
      const _submitButton = screen.getByText("Update Cues");

      await userEvent.click(checkbox);
      await userEvent.type(input, "invalid");
      fireEvent.click(_submitButton);

      expect(
        screen.getByText("Fade in time must be a valid positive number"),
      ).toBeInTheDocument();
    });

    it("shows error for negative fade in time", async () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Fade In Time (seconds)");
      const input = screen.getAllByPlaceholderText("3.0")[0];

      await userEvent.click(checkbox);
      await userEvent.type(input, "-1");
      const form = document.getElementById("bulk-fade-update-form");
      fireEvent.submit(form!);

      expect(
        screen.getByText("Fade in time must be a valid positive number"),
      ).toBeInTheDocument();
    });

    it("shows error for invalid fade out time", async () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Fade Out Time (seconds)");
      const input = screen.getAllByPlaceholderText("3.0")[1];
      const _submitButton = screen.getByText("Update Cues");

      await userEvent.click(checkbox);
      await userEvent.type(input, "abc");
      fireEvent.click(_submitButton);

      expect(
        screen.getByText("Fade out time must be a valid positive number"),
      ).toBeInTheDocument();
    });

    it("shows error for invalid follow time", async () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Follow Time (seconds)");
      const input = screen.getByPlaceholderText("0.0");

      await userEvent.click(checkbox);
      await userEvent.type(input, "-5");
      const form = document.getElementById("bulk-fade-update-form");
      fireEvent.submit(form!);

      expect(
        screen.getByText(
          "Follow time must be a valid positive number or empty to clear",
        ),
      ).toBeInTheDocument();
    });

    it("accepts zero values for all timing inputs", async () => {
      const mocks = [
        {
          request: {
            query: BULK_UPDATE_CUES,
            variables: {
              input: {
                cueIds: ["1", "2"],
                fadeInTime: 0,
                fadeOutTime: 0,
                followTime: 0,
              },
            },
          },
          result: {
            data: {
              bulkUpdateCues: mockSelectedCues.map((cue) => ({
                ...cue,
                cueNumber: cue.cueNumber + 1,
                scene: {
                  id: cue.scene.id,
                  name: `Scene ${cue.cueNumber + 1}`,
                },
              })),
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const fadeInCheckbox = screen.getByLabelText("Fade In Time (seconds)");
      const fadeOutCheckbox = screen.getByLabelText("Fade Out Time (seconds)");
      const followCheckbox = screen.getByLabelText("Follow Time (seconds)");
      const fadeInInput = screen.getAllByPlaceholderText("3.0")[0];
      const fadeOutInput = screen.getAllByPlaceholderText("3.0")[1];
      const followInput = screen.getByPlaceholderText("0.0");
      const _submitButton = screen.getByText("Update Cues");

      await userEvent.click(fadeInCheckbox);
      await userEvent.click(fadeOutCheckbox);
      await userEvent.click(followCheckbox);
      await userEvent.type(fadeInInput, "0");
      await userEvent.type(fadeOutInput, "0");
      await userEvent.type(followInput, "0");
      fireEvent.click(_submitButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe("form submission", () => {
    it("submits with fade in time only", async () => {
      const mocks = [
        {
          request: {
            query: BULK_UPDATE_CUES,
            variables: {
              input: {
                cueIds: ["1", "2"],
                fadeInTime: 4.5,
              },
            },
          },
          result: {
            data: {
              bulkUpdateCues: mockSelectedCues.map((cue) => ({
                ...cue,
                cueNumber: cue.cueNumber + 1,
                scene: {
                  id: cue.scene.id,
                  name: `Scene ${cue.cueNumber + 1}`,
                },
              })),
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Fade In Time (seconds)");
      const input = screen.getAllByPlaceholderText("3.0")[0];
      const _submitButton = screen.getByText("Update Cues");

      await userEvent.click(checkbox);
      await userEvent.type(input, "4.5");
      fireEvent.click(_submitButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("submits with all timing values", async () => {
      const mocks = [
        {
          request: {
            query: BULK_UPDATE_CUES,
            variables: {
              input: {
                cueIds: ["1", "2"],
                fadeInTime: 2.5,
                fadeOutTime: 3.5,
                followTime: 1.0,
              },
            },
          },
          result: {
            data: {
              bulkUpdateCues: mockSelectedCues.map((cue) => ({
                ...cue,
                cueNumber: cue.cueNumber + 1,
                scene: {
                  id: cue.scene.id,
                  name: `Scene ${cue.cueNumber + 1}`,
                },
              })),
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const fadeInCheckbox = screen.getByLabelText("Fade In Time (seconds)");
      const fadeOutCheckbox = screen.getByLabelText("Fade Out Time (seconds)");
      const followCheckbox = screen.getByLabelText("Follow Time (seconds)");
      const fadeInInput = screen.getAllByPlaceholderText("3.0")[0];
      const fadeOutInput = screen.getAllByPlaceholderText("3.0")[1];
      const followInput = screen.getByPlaceholderText("0.0");
      const _submitButton = screen.getByText("Update Cues");

      await userEvent.click(fadeInCheckbox);
      await userEvent.click(fadeOutCheckbox);
      await userEvent.click(followCheckbox);
      await userEvent.type(fadeInInput, "2.5");
      await userEvent.type(fadeOutInput, "3.5");
      await userEvent.type(followInput, "1.0");
      fireEvent.click(_submitButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("submits with empty follow time to clear", async () => {
      const mocks = [
        {
          request: {
            query: BULK_UPDATE_CUES,
            variables: {
              input: {
                cueIds: ["1", "2"],
                followTime: undefined,
              },
            },
          },
          result: {
            data: {
              bulkUpdateCues: mockSelectedCues.map((cue) => ({
                ...cue,
                cueNumber: cue.cueNumber + 1,
                scene: {
                  id: cue.scene.id,
                  name: `Scene ${cue.cueNumber + 1}`,
                },
              })),
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Follow Time (seconds)");
      const _submitButton = screen.getByText("Update Cues");

      await userEvent.click(checkbox);
      // Leave input empty to clear follow time
      fireEvent.click(_submitButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("clears error on successful submission", async () => {
      const mocks = [
        {
          request: {
            query: BULK_UPDATE_CUES,
            variables: {
              input: {
                cueIds: ["1", "2"],
                fadeInTime: 3,
              },
            },
          },
          result: {
            data: {
              bulkUpdateCues: mockSelectedCues.map((cue) => ({
                ...cue,
                cueNumber: cue.cueNumber + 1,
                scene: {
                  id: cue.scene.id,
                  name: `Scene ${cue.cueNumber + 1}`,
                },
              })),
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Fade In Time (seconds)");
      const input = screen.getAllByPlaceholderText("3.0")[0];
      const submitButton = screen.getByText("Update Cues");

      // First trigger an error
      const form = document.getElementById("bulk-fade-update-form");
      fireEvent.submit(form!);
      expect(
        screen.getByText("Please select at least one timing to update"),
      ).toBeInTheDocument();

      // Then submit successfully
      await userEvent.click(checkbox);
      await userEvent.type(input, "3");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.queryByText("Please select at least one timing to update"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("loading state", () => {
    it("shows loading text when submitting", async () => {
      const mocks = [
        {
          request: {
            query: BULK_UPDATE_CUES,
            variables: {
              input: {
                cueIds: ["1", "2"],
                fadeInTime: 3,
              },
            },
          },
          delay: 100,
          result: {
            data: {
              bulkUpdateCues: mockSelectedCues.map((cue) => ({
                ...cue,
                cueNumber: cue.cueNumber + 1,
                scene: {
                  id: cue.scene.id,
                  name: `Scene ${cue.cueNumber + 1}`,
                },
              })),
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Fade In Time (seconds)");
      const input = screen.getAllByPlaceholderText("3.0")[0];
      const _submitButton = screen.getByText("Update Cues");

      await userEvent.click(checkbox);
      await userEvent.type(input, "3");
      fireEvent.click(_submitButton);

      expect(screen.getByText("Updating...")).toBeInTheDocument();
    });

    it("disables buttons when loading", async () => {
      const mocks = [
        {
          request: {
            query: BULK_UPDATE_CUES,
            variables: {
              input: {
                cueIds: ["1", "2"],
                fadeInTime: 3,
              },
            },
          },
          delay: 100,
          result: {
            data: {
              bulkUpdateCues: mockSelectedCues.map((cue) => ({
                ...cue,
                cueNumber: cue.cueNumber + 1,
                scene: {
                  id: cue.scene.id,
                  name: `Scene ${cue.cueNumber + 1}`,
                },
              })),
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Fade In Time (seconds)");
      const input = screen.getAllByPlaceholderText("3.0")[0];
      const _submitButton = screen.getByText("Update Cues");
      const cancelButton = screen.getByText("Cancel");

      await userEvent.click(checkbox);
      await userEvent.type(input, "3");
      fireEvent.click(_submitButton);

      expect(screen.getByText("Updating...")).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe("error handling", () => {
    it("displays mutation error", async () => {
      const mocks = [
        {
          request: {
            query: BULK_UPDATE_CUES,
            variables: {
              input: {
                cueIds: ["1", "2"],
                fadeInTime: 3,
              },
            },
          },
          error: new Error("Failed to update cues"),
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Fade In Time (seconds)");
      const input = screen.getAllByPlaceholderText("3.0")[0];
      const _submitButton = screen.getByText("Update Cues");

      await userEvent.click(checkbox);
      await userEvent.type(input, "3");
      fireEvent.click(_submitButton);

      await waitFor(() => {
        expect(screen.getByText("Failed to update cues")).toBeInTheDocument();
      });
    });

    it("displays error with proper styling", async () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const form = document.getElementById("bulk-fade-update-form");
      fireEvent.submit(form!);

      const errorElement = screen.getByText(
        "Please select at least one timing to update",
      );
      const errorContainer = errorElement.parentElement;

      expect(errorContainer).toHaveClass(
        "bg-red-50",
        "dark:bg-red-900/20",
        "border",
        "border-red-200",
      );
      expect(errorElement).toHaveClass(
        "text-red-800",
        "dark:text-red-200",
        "text-sm",
      );
    });
  });

  describe("modal close behavior", () => {
    it("calls onClose when cancel button is clicked", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it("resets form when closing", async () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Fade In Time (seconds)");
      const input = screen.getAllByPlaceholderText("3.0")[0];
      const cancelButton = screen.getByText("Cancel");

      await userEvent.click(checkbox);
      await userEvent.type(input, "5");

      expect(checkbox).toBeChecked();
      expect(input).toHaveValue(5);

      fireEvent.click(cancelButton);

      // Component should reset on next render
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const newCheckbox = screen.getByLabelText("Fade In Time (seconds)");
      const newInput = screen.getAllByPlaceholderText("3.0")[0];

      expect(newCheckbox).not.toBeChecked();
      expect(newInput).toHaveValue(null);
    });

    it("resets form and closes after successful update", async () => {
      const mocks = [
        {
          request: {
            query: BULK_UPDATE_CUES,
            variables: {
              input: {
                cueIds: ["1", "2"],
                fadeInTime: 3,
              },
            },
          },
          result: {
            data: {
              bulkUpdateCues: mockSelectedCues.map((cue) => ({
                ...cue,
                cueNumber: cue.cueNumber + 1,
                scene: {
                  id: cue.scene.id,
                  name: `Scene ${cue.cueNumber + 1}`,
                },
              })),
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Fade In Time (seconds)");
      const input = screen.getAllByPlaceholderText("3.0")[0];
      const _submitButton = screen.getByText("Update Cues");

      await userEvent.click(checkbox);
      await userEvent.type(input, "3");
      fireEvent.click(_submitButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe("styling", () => {
    it("applies correct modal overlay classes", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const backdrop = screen.getByTestId("bulk-fade-update-modal-backdrop");
      expect(backdrop).toHaveClass(
        "fixed",
        "inset-0",
        "bg-black",
        "bg-opacity-50",
        "z-50",
      );
    });

    it("applies correct modal content classes", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveClass(
        "bg-white",
        "dark:bg-gray-800",
        "rounded-lg",
        "shadow-xl",
      );
    });

    it("applies correct checkbox styling", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Fade In Time (seconds)");
      expect(checkbox).toHaveClass(
        "rounded",
        "border-gray-300",
        "text-blue-600",
        "focus:ring-blue-500",
        "h-5",
        "w-5",
      );
    });

    it("applies correct input styling", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const input = screen.getAllByPlaceholderText("3.0")[0];
      expect(input).toHaveClass(
        "w-24",
        "px-3",
        "py-2",
        "border",
        "border-gray-300",
        "dark:border-gray-600",
        "rounded-md",
        "text-base",
        "focus:ring-blue-500",
        "focus:border-blue-500",
        "dark:bg-gray-700",
        "dark:text-white",
        "disabled:opacity-50",
      );
    });

    it("applies correct button styling on desktop", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const cancelButton = screen.getByText("Cancel");
      expect(cancelButton).toHaveClass(
        "px-4",
        "py-2",
        "text-sm",
        "font-medium",
        "text-gray-700",
        "dark:text-gray-300",
        "bg-white",
        "dark:bg-gray-700",
        "border",
        "border-gray-300",
        "dark:border-gray-600",
        "rounded-md",
      );

      const submitButton = screen.getByText("Update Cues");
      expect(submitButton).toHaveClass(
        "px-4",
        "py-2",
        "text-sm",
        "font-medium",
        "text-white",
        "bg-blue-600",
        "border",
        "border-transparent",
        "rounded-md",
        "disabled:opacity-50",
        "disabled:cursor-not-allowed",
      );
    });
  });

  describe("edge cases", () => {
    it("handles empty selectedCues array", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} selectedCues={[]} />
        </MockedProvider>,
      );

      expect(
        screen.getByText("Update timing for 0 selected cues"),
      ).toBeInTheDocument();
    });

    it("handles single selected cue", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal
            {...defaultProps}
            selectedCues={[mockSelectedCues[0]]}
          />
        </MockedProvider>,
      );

      expect(
        screen.getByText("Update timing for 1 selected cues"),
      ).toBeInTheDocument();
    });

    it("handles decimal number inputs", async () => {
      const mocks = [
        {
          request: {
            query: BULK_UPDATE_CUES,
            variables: {
              input: {
                cueIds: ["1", "2"],
                fadeInTime: 4.5, // Using 4.5 instead of multi-decimal (e.g., 2.75) due to userEvent.type quirk
              },
            },
          },
          result: {
            data: {
              bulkUpdateCues: mockSelectedCues.map((cue) => ({
                ...cue,
                cueNumber: cue.cueNumber + 1,
                scene: {
                  id: cue.scene.id,
                  name: `Scene ${cue.cueNumber + 1}`,
                },
              })),
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Fade In Time (seconds)");
      const input = screen.getAllByPlaceholderText("3.0")[0];
      const _submitButton = screen.getByText("Update Cues");

      await userEvent.click(checkbox);
      await userEvent.type(input, "4.5");
      fireEvent.click(_submitButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("trims whitespace from follow time input", async () => {
      const mocks = [
        {
          request: {
            query: BULK_UPDATE_CUES,
            variables: {
              input: {
                cueIds: ["1", "2"],
                followTime: undefined,
              },
            },
          },
          result: {
            data: {
              bulkUpdateCues: mockSelectedCues.map((cue) => ({
                ...cue,
                cueNumber: cue.cueNumber + 1,
                scene: {
                  id: cue.scene.id,
                  name: `Scene ${cue.cueNumber + 1}`,
                },
              })),
            },
          },
        },
      ];

      render(
        <MockedProvider mocks={mocks}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const checkbox = screen.getByLabelText("Follow Time (seconds)");
      const input = screen.getByPlaceholderText("0.0");
      const _submitButton = screen.getByText("Update Cues");

      await userEvent.click(checkbox);
      await userEvent.type(input, "   "); // Just whitespace
      fireEvent.click(_submitButton);

      await waitFor(() => {
        expect(mockOnUpdate).toHaveBeenCalled();
      });
    });
  });

  describe("mobile behavior", () => {
    beforeEach(() => {
      mockUseIsMobile.mockReturnValue(true);
    });

    it("stacks buttons vertically on mobile", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const submitButton = screen.getByText("Update Cues");
      const buttonContainer = submitButton.parentElement;
      expect(buttonContainer).toHaveClass("flex-col");
    });

    it("shows Update Cues button first on mobile", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const buttons = screen.getAllByRole("button");
      const buttonLabels = buttons.map((b) => b.textContent);
      // Update Cues should come before Cancel on mobile
      const updateIndex = buttonLabels.indexOf("Update Cues");
      const cancelIndex = buttonLabels.indexOf("Cancel");
      expect(updateIndex).toBeLessThan(cancelIndex);
    });

    it("has larger touch targets on mobile", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const submitButton = screen.getByText("Update Cues");
      const cancelButton = screen.getByText("Cancel");

      expect(submitButton).toHaveClass("min-h-[44px]");
      expect(cancelButton).toHaveClass("min-h-[44px]");
    });

    it("has touch-manipulation class on mobile buttons", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const submitButton = screen.getByText("Update Cues");
      const cancelButton = screen.getByText("Cancel");

      expect(submitButton).toHaveClass("touch-manipulation");
      expect(cancelButton).toHaveClass("touch-manipulation");
    });

    it("renders as BottomSheet dialog", () => {
      render(
        <MockedProvider mocks={[]}>
          <BulkFadeUpdateModal {...defaultProps} />
        </MockedProvider>,
      );

      const dialog = screen.getByRole("dialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });
  });
});
