/**
 * Component-level tests for the UI primitives defined in App.js.
 *
 * NOTE: These tests require the primitive components (Badge, Btn, Input,
 * Select, Table, ErrMsg, Modal) to be exported from App.js.
 * Currently App.js only has a default export; adding named exports for these
 * components is the recommended next step (see COVERAGE_GAPS.md).
 *
 * The tests below are written to match the expected public API and will pass
 * once the named exports are in place. They serve as a specification for
 * what should be covered.
 *
 * To enable these tests:
 *   1. Add `export` to each primitive component declaration in App.js, e.g.:
 *        export const Badge = ...
 *        export const Btn   = ...
 *      etc.
 *   2. Install testing libraries (already bundled with react-scripts):
 *        npm install  # installs react-scripts which bundles @testing-library/react
 *   3. Run: npm test
 */

// Uncomment the import below once named exports are added to App.js:
// import { Badge, Btn, Input, Select, Table, ErrMsg, Modal } from "../App";

// ─── Placeholder tests that document what SHOULD be covered ─────────────────

describe("Badge component [requires named export from App.js]", () => {
  it.todo("renders its children as text");
  it.todo("applies a default teal colour when no color prop is given");
  it.todo("applies a custom colour passed via the color prop");
});

describe("Btn component [requires named export from App.js]", () => {
  it.todo("renders children text");
  it.todo("calls onClick when clicked");
  it.todo("does not call onClick when disabled");
  it.todo("renders as disabled when the disabled prop is true");
  it.todo("renders the primary variant by default");
  it.todo("renders the danger variant with correct styles");
  it.todo("renders an icon when the icon prop is provided");
});

describe("Input component [requires named export from App.js]", () => {
  it.todo("renders a text input by default");
  it.todo("renders a textarea when textarea prop is true");
  it.todo("calls onChange with the typed value");
  it.todo("renders a label when the label prop is provided");
  it.todo("shows a required asterisk when required prop is true");
  it.todo("renders placeholder text");
});

describe("Select component [requires named export from App.js]", () => {
  it.todo("renders a default empty option");
  it.todo("renders all provided options");
  it.todo("calls onChange with the selected value");
  it.todo("renders a label when provided");
});

describe("Table component [requires named export from App.js]", () => {
  it.todo("renders column headers");
  it.todo("renders a row for each data item");
  it.todo("renders the emptyMsg when data is an empty array");
  it.todo("calls onEdit with the row when the edit button is clicked");
  it.todo("calls onDelete with the row id when the delete button is clicked");
  it.todo("renders custom cell content via the col.render function");
  it.todo("does not render action column when no action handlers are provided");
});

describe("ErrMsg component [requires named export from App.js]", () => {
  it.todo("renders the error message text");
  it.todo("renders a retry button when onRetry is provided");
  it.todo("calls onRetry when the retry button is clicked");
  it.todo("does not render a retry button when onRetry is not provided");
});

describe("Modal component [requires named export from App.js]", () => {
  it.todo("renders the title");
  it.todo("renders children content");
  it.todo("calls onClose when the backdrop is clicked");
  it.todo("calls onClose when the close button is clicked");
  it.todo("does not propagate click events from content to backdrop");
});

// ─── Example of how a Badge test would look once export is added ─────────────
//
// import { render, screen } from "@testing-library/react";
//
// describe("Badge - live example", () => {
//   it("renders its children", () => {
//     render(<Badge>Ativo</Badge>);
//     expect(screen.getByText("Ativo")).toBeInTheDocument();
//   });
//
//   it("uses the passed color for text and border", () => {
//     const { container } = render(<Badge color="#ff0000">Erro</Badge>);
//     const span = container.querySelector("span");
//     expect(span.style.color).toBe("rgb(255, 0, 0)");
//   });
// });
