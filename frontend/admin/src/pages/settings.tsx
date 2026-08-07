import { useState } from "react";
import { useAuthStore } from "../store/auth.store";
import {
  User,
  Shield,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Loader2,
  Key,
  Check,
} from "lucide-react";
import axios from "axios";
import { startRegistration } from "@simplewebauthn/browser";
import { Button } from "@origin-flow/ui";

export function SettingsPage() {
  const { user, setAuth, token } = useAuthStore();

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    avatarUrl: user?.avatarUrl || "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Passkey State
  const [isRegistering, setIsRegistering] = useState(false);
  const [passkeyMsg, setPasskeyMsg] = useState({ text: "", type: "" });

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      setErrorMsg("");
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/users/${user?.id}`,
        {
          name: editData.name,
          phone: editData.phone,
          avatarUrl: editData.avatarUrl,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (token) setAuth(response.data, token);
      setIsEditing(false);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || "Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterPasskey = async () => {
    try {
      setIsRegistering(true);
      setPasskeyMsg({ text: "", type: "" });

      const optionsRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/passkeys/register-options`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const attResp = await startRegistration({ optionsJSON: optionsRes.data });

      const verifyRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/passkeys/register-verify`,
        attResp,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (verifyRes.data?.verified) {
        setPasskeyMsg({
          text: "Passkey registered successfully!",
          type: "success",
        });
        
        // Refresh user data to show passkey existence
        if (user?.id) {
          const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/users/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setAuth(userRes.data, token!);
        }
      } else {
        setPasskeyMsg({ text: "Passkey verification failed.", type: "error" });
      }
    } catch (error: any) {
      if (error.name === "NotAllowedError") {
        setPasskeyMsg({
          text: "Passkey registration was cancelled.",
          type: "error",
        });
      } else {
        setPasskeyMsg({
          text: "An error occurred during passkey registration.",
          type: "error",
        });
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRevokePasskey = async () => {
    try {
      setIsRegistering(true); // Reusing loader state for simplicity
      setPasskeyMsg({ text: "", type: "" });

      await axios.delete(`${import.meta.env.VITE_API_URL}/auth/passkeys`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPasskeyMsg({ text: "Passkey revoked successfully.", type: "success" });
      
      // Refresh user data
      if (user?.id) {
        const userRes = await axios.get(`${import.meta.env.VITE_API_URL}/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAuth(userRes.data, token!);
      }
    } catch (error: any) {
      setPasskeyMsg({ text: "Failed to revoke passkey.", type: "error" });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="w-full space-y-8 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
            Settings
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Profile Section - 3 columns */}
        <div className="lg:col-span-3 space-y-8">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900">
            {/* Profile Header */}
            <div className="p-8">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-5">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Avatar"
                        className="size-20 rounded-full object-cover border border-zinc-200 dark:border-zinc-700"
                      />
                    ) : (
                      <div className="flex size-20 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-2xl font-semibold text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                        {getInitials(user?.name)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                      {user?.name || "Loading..."}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                      <Mail className="size-3.5" />
                      {user?.email || "..."}
                    </p>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        <Shield className="size-3" />
                        {user?.role || "USER"}
                      </span>
                      {user?.isVerified && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          <Check className="size-3" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!isEditing && (
                  <Button onClick={() => setIsEditing(true)}>Edit</Button>
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="border-t border-zinc-200 dark:border-zinc-800">
              {isEditing ? (
                <div className="p-8 space-y-5">
                  {errorMsg && (
                    <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-md border border-red-200 dark:border-red-500/20">
                      {errorMsg}
                    </div>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) =>
                          setEditData({ ...editData, name: e.target.value })
                        }
                        className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        value={editData.phone}
                        onChange={(e) =>
                          setEditData({ ...editData, phone: e.target.value })
                        }
                        className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Avatar URL
                      </label>
                      <input
                        type="text"
                        value={editData.avatarUrl}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            avatarUrl: e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent"
                        placeholder="https://example.com/avatar.png"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <Button
                      onClick={() => {
                        setIsEditing(false);
                        setErrorMsg("");
                        setEditData({
                          name: user?.name || "",
                          phone: user?.phone || "",
                          avatarUrl: user?.avatarUrl || "",
                        });
                      }}
                      color="tertiary"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile} isDisabled={isSaving}>
                      {isSaving ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8 grid gap-3 sm:grid-cols-2">
                  <InfoRow
                    icon={User}
                    label="Full Name"
                    value={user?.name || "-"}
                  />
                  <InfoRow
                    icon={Phone}
                    label="Phone Number"
                    value={user?.phone || "Not provided"}
                  />
                  <InfoRow
                    icon={Briefcase}
                    label="Company ID"
                    value={user?.companyId || "N/A"}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Member Since"
                    value={
                      user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "-"
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Section - 2 columns */}
        <div className="lg:col-span-2 space-y-8">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                Security
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Manage your account security preferences.
              </p>
            </div>

            {passkeyMsg.text && (
              <div
                className={`mb-4 p-3 text-sm rounded-md border ${
                  passkeyMsg.type === "success"
                    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20"
                    : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20"
                }`}
              >
                {passkeyMsg.text}
              </div>
            )}

            <div className="flex items-start justify-between border border-zinc-200 dark:border-zinc-700 rounded-md p-4">
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Key className="size-4 text-zinc-600 dark:text-zinc-400" />
                  Passkey Authentication
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[280px]">
                  {user?.passkeys && user.passkeys.length > 0
                    ? "You have a device fingerprint (FaceID/TouchID) registered for fast, secure sign-in."
                    : "Register your device fingerprint (FaceID/TouchID) for fast, secure sign-in."}
                </p>
              </div>
              
              {user?.passkeys && user.passkeys.length > 0 ? (
                <Button
                  onClick={handleRevokePasskey}
                  isDisabled={isRegistering}
                  color="primary-destructive"
                >
                  {isRegistering ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Revoke Passkey"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleRegisterPasskey}
                  isDisabled={isRegistering}
                >
                  {isRegistering ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : passkeyMsg.type === "success" ? (
                    <>
                      <Check className="size-4 text-emerald-600 dark:text-emerald-400" />
                      Registered
                    </>
                  ) : (
                    "Register Device"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Info Row Component
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-md border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
      <Icon className="size-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}
