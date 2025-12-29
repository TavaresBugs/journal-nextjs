"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import dynamic from "next/dynamic";
import type { Account } from "@/types";

// Dynamic imports for non-critical header components
const NotificationBell = dynamic(
  () => import("@/components/notifications").then((mod) => mod.NotificationBell),
  {
    ssr: false,
    loading: () => <div className="h-12 w-12 rounded-xl bg-gray-800/50" />,
  }
);

const MentalButton = dynamic(() => import("@/components/mental").then((mod) => mod.MentalButton), {
  ssr: false,
  loading: () => <div className="h-12 w-12 rounded-xl bg-gray-800/50" />,
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
    <div className="mb-6 flex flex-col gap-3">
      {/* Row 1: Back + Title + Icons */}
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/")} leftIcon={<BackIcon />}>
            Voltar
          </Button>
          <div className="hidden h-6 w-px bg-gray-700 sm:block"></div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-100 sm:text-2xl">{account.name}</h1>
            <p className="text-sm text-gray-400">
              {account.currency} • {account.leverage}
            </p>
          </div>
        </div>

        {/* Icons - desktop only (md+) */}
        <div className="hidden items-center gap-2 md:flex">
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
                      className="h-12 w-12 shrink-0 rounded-xl"
                    >
                      <Icon size={24} />
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
            className="h-12 w-12 shrink-0 rounded-xl"
          >
            <SettingsIcon size={24} />
          </Button>
        </div>
      </div>

      {/* Row 2: Icons - mobile only (< md) */}
      <div className="-mx-2 flex items-center gap-2 overflow-x-auto px-2 pb-1 md:hidden">
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
                    className="h-11 w-11 shrink-0 rounded-xl"
                  >
                    <Icon size={22} />
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
          className="h-11 w-11 shrink-0 rounded-xl"
        >
          <SettingsIcon size={22} />
        </Button>
      </div>
    </div>
  );
}
