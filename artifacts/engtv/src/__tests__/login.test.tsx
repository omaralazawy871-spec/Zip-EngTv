import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Login from "@/pages/admin/login";

// Mock wouter
vi.mock("wouter", () => ({
  useLocation: vi.fn(() => ["/admin/login", vi.fn()]),
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  Route: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Switch: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock @workspace/api-client-react
vi.mock("@workspace/api-client-react", () => ({
  useAdminLogin: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render login form", () => {
    render(<Login />);
    expect(screen.getByPlaceholderText(/كلمة المرور/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /دخول/i })).toBeInTheDocument();
  });

  it("should show error when submitting empty password", async () => {
    const user = userEvent.setup();
    render(<Login />);
    await user.click(screen.getByRole("button", { name: /دخول/i }));
    // Should show validation message
    expect(screen.getByText(/كلمة المرور/i)).toBeInTheDocument();
  });
});
