"use client";

import Image from "next/image";
import type { UserExtended } from "@/types";

interface AdminMentorTableProps {
  users: UserExtended[];
  onToggleMentor: (id: string, isMentor: boolean) => void;
  loading: boolean;
}

/**
 * Admin mentor management table.
 * Shows current mentors and allows adding/removing mentor role.
 */
export function AdminMentorTable({ users, onToggleMentor, loading }: AdminMentorTableProps) {
  if (loading) {
    return (
      <div className="py-12 text-center text-gray-400">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-500"></div>
        Carregando usuários...
      </div>
    );
  }

  // Filter to show only approved users (potential mentors)
  const approvedUsers = users.filter((u) => u.status === "approved" && u.role !== "admin");
  const mentors = approvedUsers.filter((u) => u.role === "mentor");
  const nonMentors = approvedUsers.filter((u) => u.role !== "mentor");

  return (
    <div className="p-6">
      {/* Current Mentors */}
      <div className="mb-8">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-cyan-400">
          🎓 Mentores Ativos ({mentors.length})
        </h3>
        {mentors.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-700 py-4 text-center text-gray-500">
            Nenhum mentor definido ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mentors.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between rounded-xl border border-cyan-500/30 bg-gray-800/50 p-4"
              >
                <div className="flex items-center gap-3">
                  {user.avatarUrl && user.avatarUrl.length > 0 ? (
                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-cyan-500/30">
                      <Image
                        src={user.avatarUrl}
                        alt=""
                        fill
                        className="object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/20 font-bold text-cyan-400">
                      {user.name?.charAt(0).toUpperCase() ||
                        user.email?.charAt(0).toUpperCase() ||
                        "U"}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-white">{user.name || "Sem nome"}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => onToggleMentor(user.id, false)}
                  className="rounded-lg border border-red-500/30 bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/30"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Mentors */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-300">
          👤 Adicionar como Mentor
        </h3>
        {nonMentors.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-700 py-4 text-center text-gray-500">
            Todos os usuários aprovados já são mentores.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700 bg-gray-900/50">
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Usuário</th>
                  <th className="w-32 px-4 py-3 text-center font-medium text-gray-400">Ação</th>
                </tr>
              </thead>
              <tbody>
                {nonMentors.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gray-800 transition-colors hover:bg-gray-900/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl && user.avatarUrl.length > 0 ? (
                          <div className="relative h-8 w-8 overflow-hidden rounded-full border border-gray-700">
                            <Image
                              src={user.avatarUrl}
                              alt=""
                              fill
                              className="object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-sm font-medium text-gray-400">
                            {user.name?.charAt(0).toUpperCase() ||
                              user.email?.charAt(0).toUpperCase() ||
                              "U"}
                          </div>
                        )}
                        <div>
                          <div className="text-white">{user.name || "Sem nome"}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onToggleMentor(user.id, true)}
                        className="rounded-lg border border-cyan-500/30 bg-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-400 transition-colors hover:bg-cyan-500/30"
                      >
                        + Tornar Mentor
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
