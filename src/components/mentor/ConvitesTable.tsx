"use client";

import { Button } from "@/components/ui/Button";
import Image from "next/image";
import type { MentorInvite } from "@/types";

interface ConvitesTableProps {
  invites: MentorInvite[];
  onRevoke: (id: string) => void;
  loading: boolean;
}

const getStatusBadge = (status: string) => {
  const styles: Record<string, string> = {
    pending: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    accepted: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    rejected: "bg-red-500/20 text-red-400 border border-red-500/30",
    revoked: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  };
  const labels: Record<string, string> = {
    pending: "Pendente",
    accepted: "Aceito",
    rejected: "Rejeitado",
    revoked: "Revogado",
  };
  return (
    <span className={`rounded px-2 py-1 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

/**
 * Table showing sent invites with status and actions.
 */
export function ConvitesTable({ invites, onRevoke, loading }: ConvitesTableProps) {
  if (loading) {
    return (
      <div className="py-12 text-center text-gray-400">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-500"></div>
        Carregando convites...
      </div>
    );
  }

  if (invites.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <span className="mb-3 block text-4xl">📤</span>
        Nenhum convite enviado ainda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-900/50">
            <th className="px-6 py-4 text-left font-medium text-gray-400">Mentorado</th>
            <th className="px-4 py-4 text-center font-medium text-gray-400">Permissão</th>
            <th className="px-4 py-4 text-center font-medium text-gray-400">Status</th>
            <th className="px-4 py-4 text-center font-medium text-gray-400">Enviado em</th>
            <th className="px-4 py-4 text-center font-medium text-gray-400">Ações</th>
          </tr>
        </thead>
        <tbody>
          {invites.map((invite) => (
            <tr
              key={invite.id}
              className="border-b border-gray-800 transition-colors hover:bg-gray-900/30"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 shrink-0">
                    {invite.menteeAvatar ? (
                      <Image
                        src={invite.menteeAvatar}
                        alt={invite.menteeName || invite.menteeEmail || ""}
                        width={40}
                        height={40}
                        className="h-full w-full rounded-full border border-gray-700 object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full border border-gray-700 bg-gray-800 font-bold text-gray-400">
                        {(invite.menteeName || invite.menteeEmail || "M").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-white">
                      {invite.menteeName || invite.menteeEmail || "Usuário desconhecido"}
                    </span>
                    {invite.menteeName && (
                      <span className="text-xs text-gray-500">{invite.menteeEmail}</span>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-center">
                <span
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    invite.permission === "comment"
                      ? "border border-purple-500/30 bg-purple-500/20 text-purple-400"
                      : "border border-cyan-500/30 bg-cyan-500/20 text-cyan-400"
                  }`}
                >
                  {invite.permission === "comment" ? "Comentar" : "Visualizar"}
                </span>
              </td>
              <td className="px-4 py-4 text-center">{getStatusBadge(invite.status)}</td>
              <td className="px-4 py-4 text-center text-gray-400">
                {new Date(invite.createdAt).toLocaleDateString("pt-BR")}
              </td>
              <td className="px-4 py-4 text-center">
                {invite.status === "pending" && (
                  <Button size="sm" variant="danger" onClick={() => onRevoke(invite.id)}>
                    Cancelar
                  </Button>
                )}
                {invite.status === "accepted" && (
                  <Button size="sm" variant="danger" onClick={() => onRevoke(invite.id)}>
                    Revogar
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
