"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Modal, Input, Button } from "@/components/ui";
import { supabase } from "@/lib/supabase";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [allowMentorView, setAllowMentorView] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile data
  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Try to get existing profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profile) {
          setDisplayName(profile.display_name || user.email?.split("@")[0] || "");
          setBio(profile.bio || "");
          setAvatarUrl(profile.avatar_url || null);
          setIsPublic(profile.is_public || false);
          setAllowMentorView(profile.allow_mentor_view !== false);
        } else {
          setDisplayName(user.email?.split("@")[0] || "");
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione uma imagem.");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 2MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Erro ao fazer upload da imagem. Tente novamente.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { error } = await supabase.from("profiles").upsert({
          id: user.id,
          display_name: displayName,
          bio: bio,
          avatar_url: avatarUrl,
          is_public: isPublic,
          allow_mentor_view: allowMentorView,
          updated_at: new Date().toISOString(),
        });

        if (error) throw error;
        onClose();
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="👤 Configurar Perfil" maxWidth="md">
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-400">
              Configure seu perfil para compartilhamento e visibilidade.
            </p>

            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                {/* Avatar Preview */}
                <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-gray-700 bg-gray-800">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="Avatar"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl text-gray-500">
                      {displayName.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                </div>

                {/* Upload Button Overlay */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-800 bg-cyan-500 text-white transition-all hover:bg-cyan-600 disabled:opacity-50"
                >
                  {isUploadingAvatar ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  )}
                </button>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-gray-500">Clique para alterar (máx. 2MB)</p>
            </div>

            {/* Display Name */}
            <div>
              <Input
                label="Nome de Exibição"
                placeholder="Como você quer ser chamado"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            {/* Bio */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Bio</label>
              <textarea
                placeholder="Uma breve descrição sobre você (opcional)"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-700 bg-[#232b32] px-4 py-3 text-sm text-gray-100 placeholder-gray-500 transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
              />
            </div>

            {/* Privacy Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-200">Privacidade</h4>

              {/* Public Profile Toggle */}
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-700/50 bg-gray-800/30 p-4">
                <div>
                  <span className="font-medium text-gray-100">Perfil Público</span>
                  <p className="text-sm text-gray-500">
                    Permitir que outros vejam seu perfil e estatísticas
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    isPublic ? "bg-cyan-500" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      isPublic ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </label>

              {/* Mentor View Toggle */}
              <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-700/50 bg-gray-800/30 p-4">
                <div>
                  <span className="font-medium text-gray-100">Acesso do Mentor</span>
                  <p className="text-sm text-gray-500">
                    Permitir que mentores vejam seus trades e progresso
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowMentorView(!allowMentorView)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    allowMentorView ? "bg-cyan-500" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                      allowMentorView ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </label>
            </div>

            {/* Save Button */}
            <Button
              variant="gradient-success"
              onClick={handleSave}
              className="w-full font-extrabold"
              disabled={isSaving}
            >
              {isSaving ? "Salvando..." : "💾 Salvar Perfil"}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
