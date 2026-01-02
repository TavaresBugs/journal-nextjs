"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import dynamic from "next/dynamic";
import type { Account } from "@/types";
import { Menu, X, ChevronDown, ArrowLeft, Check } from "lucide-react";
import { useAccountStore } from "@/store/useAccountStore";

// Dynamic imports for non-critical header components
const NotificationBell = dynamic(
  () => import("@/components/notifications").then((mod) => mod.NotificationBell),
  {
    ssr: false,
    loading: () => <div className="h-10 w-10 rounded-xl bg-gray-800/50 sm:h-12 sm:w-12" />,
  }
);

const MentalButton = dynamic(() => import("@/features/mental").then((mod) => mod.MentalButton), {
  ssr: false,
  loading: () => <div className="h-10 w-10 rounded-xl bg-gray-800/50 sm:h-12 sm:w-12" />,
});

interface DashboardHeaderProps {
  account: Account;
  isAdminUser: boolean;
  isMentorUser: boolean;
  prefetchAdmin: () => void;
  prefetchMentor: () => void;
  prefetchCommunity: () => void;
  onSettingsClick: () => void;
}

// Icon components to avoid duplication
const AdminIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const MentorIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CommunityIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h20" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const SettingsIcon = ({ size = 24 }: { size?: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="animate-spin-slow"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);

const BackIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-transform group-hover:-translate-x-1"
  >
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

/**
 * Dashboard header component with navigation icons.
 * Handles responsive layout for desktop/mobile.
 */
export function DashboardHeader({
  account,
  isAdminUser,
  isMentorUser,
  prefetchAdmin,
  prefetchMentor,
  prefetchCommunity,
  onSettingsClick,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  // Get all accounts from store
  const { accounts } = useAccountStore();

  // Close account dropdown when clicking outside
  useEffect(() => {
    if (!isAccountDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is inside the account dropdown container
      if (!target.closest("[data-account-dropdown]")) {
        setIsAccountDropdownOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isAccountDropdownOpen]);

  // Close account dropdown when opening mobile menu
  const handleMobileMenuToggle = () => {
    setIsAccountDropdownOpen(false);
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Shared icon buttons config
  const iconButtons = [
    {
      show: isAdminUser,
      href: "/admin",
      prefetch: prefetchAdmin,
      title: "Painel Admin",
      Icon: AdminIcon,
    },
    {
      show: isMentorUser || isAdminUser,
      href: "/mentor",
      prefetch: prefetchMentor,
      title: "Mentoria",
      Icon: MentorIcon,
    },
    {
      show: true,
      href: "/comunidade",
      prefetch: prefetchCommunity,
      title: "Comunidade",
      Icon: CommunityIcon,
    },
  ];

  return (
    <div className="mb-6">
      {/* MOBILE LAYOUT: Menu | Account Centered | Notification */}
      <div className="flex items-center justify-between gap-2 sm:hidden">
        {/* Menu Button (esquerda) - mesmo estilo dos outros ícones */}
        <button
          onClick={handleMobileMenuToggle}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-800/80 text-gray-400 transition-colors hover:bg-gray-700 hover:text-white"
          aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {/* Account Selector (centralizado) */}
        <div className="relative" data-account-dropdown>
          <button
            onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
            className="flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800/80 px-4 py-2 transition-colors hover:bg-gray-700"
          >
            <span className="max-w-[140px] truncate text-sm font-medium text-white">
              {account.name}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${isAccountDropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {/* Account Dropdown */}
          {isAccountDropdownOpen && (
            <div className="absolute top-full left-1/2 z-50 mt-2 w-56 -translate-x-1/2 rounded-lg border border-gray-700 bg-gray-900 py-1 shadow-xl">
              {/* Voltar option */}
              <button
                onClick={() => {
                  setIsAccountDropdownOpen(false);
                  router.push("/");
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Voltar para Home</span>
              </button>

              <div className="my-1 border-t border-gray-800" />

              {/* Accounts list */}
              <div className="max-h-48 overflow-y-auto">
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => {
                      setIsAccountDropdownOpen(false);
                      if (acc.id !== account.id) {
                        router.push(`/dashboard/${acc.id}`);
                      }
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-gray-800 ${
                      acc.id === account.id ? "bg-gray-800/50 text-cyan-400" : "text-white"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{acc.name}</p>
                      <p className="text-xs text-gray-500">
                        {acc.currency} • {acc.leverage}
                      </p>
                    </div>
                    {acc.id === account.id && <Check className="h-4 w-4 shrink-0 text-cyan-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notification (direita) */}
        <NotificationBell />
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 border-t border-gray-800 pt-3 sm:hidden">
          {iconButtons.map(
            ({ show, href, prefetch, title, Icon }) =>
              show && (
                <Link key={href} href={href} prefetch onClick={() => setIsMobileMenuOpen(false)}>
                  <div onMouseEnter={prefetch}>
                    <Button variant="primary" size="icon" title={title} className="h-10 w-10">
                      <Icon size={18} />
                    </Button>
                  </div>
                </Link>
              )
          )}
          <MentalButton />
          <Button
            variant="primary"
            size="icon"
            onClick={() => {
              onSettingsClick();
              setIsMobileMenuOpen(false);
            }}
            title="Configurações"
            className="h-10 w-10"
          >
            <SettingsIcon size={18} />
          </Button>
        </div>
      )}

      {/* DESKTOP LAYOUT: Original layout */}
      <div className="hidden items-center justify-between gap-2 sm:flex">
        {/* Left: Back + Title */}
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-4">
          <Button variant="ghost" onClick={() => router.push("/")} leftIcon={<BackIcon />}>
            Voltar
          </Button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold text-gray-100 sm:text-xl md:text-2xl">
              {account.name}
            </h1>
            <p className="text-xs text-gray-400 sm:text-sm">
              {account.currency} • {account.leverage}
            </p>
          </div>
        </div>

        {/* Right: Icons */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {iconButtons.map(
            ({ show, href, prefetch, title, Icon }) =>
              show && (
                <Link key={href} href={href} prefetch>
                  <div onMouseEnter={prefetch}>
                    <Button
                      variant="primary"
                      size="icon"
                      title={title}
                      aria-label={title}
                      className="h-10 w-10 rounded-xl sm:h-12 sm:w-12"
                    >
                      <Icon size={20} />
                    </Button>
                  </div>
                </Link>
              )
          )}
          <NotificationBell />
          <MentalButton />
          <Button
            variant="primary"
            size="icon"
            onClick={onSettingsClick}
            title="Configurações"
            aria-label="Configurações"
            className="h-10 w-10 rounded-xl sm:h-12 sm:w-12"
          >
            <SettingsIcon size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
