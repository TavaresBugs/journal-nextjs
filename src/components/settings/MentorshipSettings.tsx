"use client";

import { useEffect, useState } from "react";
import { Button, Modal } from "@/components/ui";
import {
  getMyMentors,
  getAccountPermissions,
  setAccountPermission,
  removeAccountPermission,
} from "@/services/mentor/invites";
import { getAccounts } from "@/services/core/account";
import { Account, MentorInvite, MentorAccountPermission } from "@/types";

export function MentorshipSettings() {
  const [mentors, setMentors] = useState<MentorInvite[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMentor, setSelectedMentor] = useState<MentorInvite | null>(null);
  const [permissions, setPermissions] = useState<MentorAccountPermission[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mentorsData, accountsData] = await Promise.all([getMyMentors(), getAccounts()]);
      setMentors(mentorsData);
      setAccounts(accountsData);
    } catch (error) {
      console.error("Error loading mentorship data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManagePermissions = async (mentor: MentorInvite) => {
    setSelectedMentor(mentor);
    try {
      const perms = await getAccountPermissions(mentor.id);
      setPermissions(perms);
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error loading permissions:", error);
    }
  };

  const handleTogglePermission = async (
    accountId: string,
    type: "viewTrades" | "viewJournal" | "viewRoutine",
    currentValue: boolean
  ) => {
    if (!selectedMentor) return;

    // Find existing permission or create optimistic one
    const existingPerm = permissions.find((p) => p.accountId === accountId);

    // Prepare new values
    const newValues = {
      canViewTrades: existingPerm ? existingPerm.canViewTrades : false,
      canViewJournal: existingPerm ? existingPerm.canViewJournal : false,
      canViewRoutines: existingPerm ? existingPerm.canViewRoutines : false,
    };

    // Update specific field
    if (type === "viewTrades") newValues.canViewTrades = !currentValue;
    if (type === "viewJournal") newValues.canViewJournal = !currentValue;
    if (type === "viewRoutine") newValues.canViewRoutines = !currentValue;

    // Optimistic update
    const updatedPerms = [...permissions];
    const index = updatedPerms.findIndex((p) => p.accountId === accountId);

    if (index >= 0) {
      updatedPerms[index] = { ...updatedPerms[index], ...newValues };
    } else {
      updatedPerms.push({
        id: "optimistic",
        inviteId: selectedMentor.id,
        accountId,
        createdAt: new Date().toISOString(),
        ...newValues,
      });
    }
    setPermissions(updatedPerms);

    // API Call
    try {
      // If all false, remove permission entry
      if (!newValues.canViewTrades && !newValues.canViewJournal && !newValues.canViewRoutines) {
        await removeAccountPermission(selectedMentor.id, accountId);
        // Reload to be sure
        const perms = await getAccountPermissions(selectedMentor.id);
        setPermissions(perms);
      } else {
        await setAccountPermission(selectedMentor.id, accountId, newValues);
        // Reload to get real ID
        const perms = await getAccountPermissions(selectedMentor.id);
        setPermissions(perms);
      }
    } catch (error) {
      console.error("Error updating permission:", error);
      // Revert on error? For now just log
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Carregando mentores...</div>;
  }

  if (mentors.length === 0) {
    return (
      <div className="rounded-xl border border-gray-700 bg-gray-800/30 p-8 text-center">
        <div className="mb-3 text-4xl">👨‍🏫</div>
        <h3 className="text-lg font-medium text-white">Nenhum Mentor Ativo</h3>
        <p className="mt-2 text-sm text-gray-400">
          Quando você aceitar convites de mentores, eles aparecerão aqui para você gerenciar o
          acesso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-cyan-400">
        👨‍🏫 Meus Mentores ({mentors.length})
      </h3>

      <div className="grid gap-4">
        {mentors.map((mentor) => (
          <div
            key={mentor.id}
            className="flex items-center justify-between rounded-xl border border-gray-700 bg-gray-800/50 p-4"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20 font-bold text-cyan-400">
                {mentor.mentorEmail.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="font-medium text-white">{mentor.mentorEmail}</h4>
                <p className="text-xs text-gray-400">
                  Desde {new Date(mentor.acceptedAt || "").toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => handleManagePermissions(mentor)}>
              Gerenciar Acesso
            </Button>
          </div>
        ))}
      </div>

      {selectedMentor && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          maxWidth="2xl"
          title={`🔒 Permissões para ${selectedMentor.mentorEmail}`}
        >
          <div className="space-y-6">
            <p className="text-sm text-gray-400">
              Escolha quais carteiras e informações este mentor pode visualizar.
            </p>

            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
              {accounts.map((account) => {
                const perm = permissions.find((p) => p.accountId === account.id);
                const hasAccess =
                  perm && (perm.canViewTrades || perm.canViewJournal || perm.canViewRoutines);

                return (
                  <div
                    key={account.id}
                    className={`rounded-xl border p-4 ${hasAccess ? "border-cyan-500/30 bg-cyan-900/10" : "border-gray-700 bg-gray-800/30"}`}
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white">{account.name}</h4>
                        <p className="text-xs text-gray-500">{account.currency}</p>
                      </div>
                      <div
                        className={`rounded px-2 py-1 text-xs ${hasAccess ? "bg-green-500/20 text-green-400" : "bg-gray-700 text-gray-400"}`}
                      >
                        {hasAccess ? "Acesso Permitido" : "Sem Acesso"}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <PermissionToggle
                        label="Trades"
                        active={perm?.canViewTrades || false}
                        onClick={() =>
                          handleTogglePermission(
                            account.id,
                            "viewTrades",
                            perm?.canViewTrades || false
                          )
                        }
                      />
                      <PermissionToggle
                        label="Diário"
                        active={perm?.canViewJournal || false}
                        onClick={() =>
                          handleTogglePermission(
                            account.id,
                            "viewJournal",
                            perm?.canViewJournal || false
                          )
                        }
                      />
                      <PermissionToggle
                        label="Rotina"
                        active={perm?.canViewRoutines || false}
                        onClick={() =>
                          handleTogglePermission(
                            account.id,
                            "viewRoutine",
                            perm?.canViewRoutines || false
                          )
                        }
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end border-t border-gray-700 pt-4">
              <Button variant="primary" onClick={() => setIsModalOpen(false)}>
                Concluir
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PermissionToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-lg border py-2 text-sm font-medium transition-colors ${
        active
          ? "border-cyan-500 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30"
          : "border-gray-600 bg-gray-800 text-gray-400 hover:bg-gray-700"
      }`}
    >
      {active ? "👁️" : "🔒"} {label}
    </button>
  );
}
