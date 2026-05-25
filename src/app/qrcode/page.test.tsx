import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import QrCodePage from "./page";

class MockQRCodeStyling {
  append(container: HTMLElement) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("data-testid", "mock-qr-code");
    container.appendChild(svg);
  }

  update() {}

  async download() {}
}

vi.mock("qr-code-styling", () => ({
  default: MockQRCodeStyling,
}));

describe("QrCodePage", () => {
  it("renders the generator title and main controls", async () => {
    render(<QrCodePage />);

    expect(
      screen.getByRole("heading", { name: "客製化 QR Code" })
    ).toBeInTheDocument();
    expect(screen.getByText("內容類型")).toBeInTheDocument();
    expect(screen.getByText("點陣樣式")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下載 PNG" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "下載 SVG" })).toBeEnabled();

    await waitFor(() => {
      expect(screen.getByTestId("mock-qr-code")).toBeInTheDocument();
    });
  });

  it("shows the matching fields when switching content type", () => {
    render(<QrCodePage />);

    fireEvent.click(screen.getByRole("button", { name: "Email" }));

    expect(screen.getByPlaceholderText("hello@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("主旨，可留空")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("內容，可留空")).toBeInTheDocument();
  });

  it("disables downloads and shows an error for invalid input", () => {
    render(<QrCodePage />);

    fireEvent.change(screen.getByLabelText("網址"), {
      target: { value: "" },
    });

    expect(screen.getByRole("alert")).toHaveTextContent("請輸入網址");
    expect(screen.getByRole("button", { name: "下載 PNG" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "下載 SVG" })).toBeDisabled();
  });
});
