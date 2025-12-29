/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useRouter } from "next/navigation";

// Mocks
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/notifications", () => ({
  NotificationBell: () => <div data-testid="notification-bell" />,
}));

vi.mock("@/components/mental", () => ({
  MentalButton: () => <div data-testid="mental-button" />,
}));

describe("DashboardHeader", () => {
  const mockRouter = { push: vi.fn() };
  const mockProps = {
    account: {
      id: "acc-1",
      userId: "user-1",
      name: "My Account",
      broker: "Broker X",
      initialBalance: 10000,
      currentBalance: 10000,
      currency: "USD",
      leverage: "1:100",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      maxDrawdown: 0,
    },
    isAdminUser: false,
    isMentorUser: false,
    prefetchAdmin: vi.fn(),
    prefetchMentor: vi.fn(),
    prefetchCommunity: vi.fn(),
    onSettingsClick: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useRouter).mockReturnValue(mockRouter as any);
  });

  it("should render account info", () => {
    render(<DashboardHeader {...mockProps} />);
    expect(screen.getByText("My Account")).toBeInTheDocument();
    expect(screen.getByText("USD • 1:100")).toBeInTheDocument();
  });

  it("should navigate back on back button click", () => {
    render(<DashboardHeader {...mockProps} />);
    fireEvent.click(screen.getByText("Voltar"));
    expect(mockRouter.push).toHaveBeenCalledWith("/");
  });

  it("should show community icon for all users", () => {
    render(<DashboardHeader {...mockProps} />);
    expect(screen.getAllByTitle("Comunidade")[0]).toBeInTheDocument();
  });

  it("should show admin icon only for admin users", () => {
    const { rerender } = render(<DashboardHeader {...mockProps} />);
    expect(screen.queryByTitle("Painel Admin")).not.toBeInTheDocument();

    rerender(<DashboardHeader {...mockProps} isAdminUser={true} />);
    expect(screen.getAllByTitle("Painel Admin")[0]).toBeInTheDocument();
  });

  it("should show mentor icon for mentor users", () => {
    const { rerender } = render(<DashboardHeader {...mockProps} />);
    expect(screen.queryByTitle("Mentoria")).not.toBeInTheDocument();

    rerender(<DashboardHeader {...mockProps} isMentorUser={true} />);
    expect(screen.getAllByTitle("Mentoria")[0]).toBeInTheDocument();
  });

  it("should call onSettingsClick when settings button clicked", () => {
    render(<DashboardHeader {...mockProps} />);
    // Select the settings button (desktop or mobile)
    const settingsBtns = screen.getAllByTitle("Configurações");
    fireEvent.click(settingsBtns[0]);
    expect(mockProps.onSettingsClick).toHaveBeenCalled();
  });
});
