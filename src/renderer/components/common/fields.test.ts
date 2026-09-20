import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SelectField } from "./SelectField";
import { TextArea } from "./TextArea";
import { TextField } from "./TextField";

describe("field wrappers", () => {
  it("marks a required text field on both the label and the input", () => {
    const html = renderToStaticMarkup(
      createElement(TextField, {
        label: "Internal name",
        required: true,
        value: "Year 7",
        onChange: () => undefined,
      }),
    );

    expect(html).toContain("Internal name*");
    expect(html).toMatch(/<input[^>]*required/);
  });

  it("leaves an optional text field unmarked", () => {
    const html = renderToStaticMarkup(
      createElement(TextField, { label: "Subject", value: "", onChange: () => undefined }),
    );

    expect(html).toContain(">Subject<");
    expect(html).not.toContain("Subject*");
    expect(html).not.toMatch(/<input[^>]*required/);
  });

  it("marks a required text area on both the label and the control", () => {
    const html = renderToStaticMarkup(
      createElement(TextArea, {
        label: "Description",
        required: true,
        value: "Notes",
        onChange: () => undefined,
      }),
    );

    expect(html).toContain("Description*");
    expect(html).toMatch(/<textarea[^>]*required/);
  });

  it("marks a required select on both the label and the control", () => {
    const html = renderToStaticMarkup(
      createElement(
        SelectField,
        { label: "Status", required: true, value: "counted", onChange: () => undefined },
        createElement("option", { value: "counted" }, "Counted"),
      ),
    );

    expect(html).toContain("Status*");
    expect(html).toMatch(/<select[^>]*required/);
  });

  it("renders a suffix beside the input", () => {
    const html = renderToStaticMarkup(
      createElement(TextField, {
        label: "Score",
        required: true,
        value: "8",
        onChange: () => undefined,
        suffix: createElement("span", null, "/10"),
      }),
    );

    expect(html).toContain("Score*");
    expect(html).toContain('class="field-suffix"');
    expect(html).toContain("/10");
  });
});
