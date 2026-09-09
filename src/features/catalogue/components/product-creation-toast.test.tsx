import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProductCreationToast } from "./product-creation-toast";

afterEach(() => vi.useRealTimers());

describe("ProductCreationToast", () => {
  it("shows and dismisses a success notification", () => {
    render(<ProductCreationToast state={{ success: "Product created" }} />);
    expect(screen.getByRole("status")).toHaveTextContent("Product created successfully.");
    fireEvent.click(screen.getByRole("button", { name: /dismiss product notification/i }));
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("keeps the useful error and expires after seven seconds", () => {
    vi.useFakeTimers();
    render(<ProductCreationToast state={{ error: "Select a price list when entering a selling price" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Select a price list when entering a selling price");
    act(() => vi.advanceTimersByTime(7000));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("renders into the document body so fixed positioning is viewport anchored", () => {
    render(<ProductCreationToast state={{ success: "Product created" }} />);
    const toast = screen.getByRole("status");
    expect(toast.parentElement).toBe(document.body);
  });
});
