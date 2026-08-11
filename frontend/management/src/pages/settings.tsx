import { useState, useEffect } from "react";
import { useAuthStore, type CompanyProfile } from "../store/auth.store";
import {
  Building2,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Fingerprint,
} from "lucide-react";
import { Button, Card } from "@origin-flow/ui";
import { UserService } from "../services/user-service";
import { startRegistration } from "@simplewebauthn/browser";
import { api } from "../services/api";

export function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const isCompany = user?.role === "COMPANY";

  const [activeTab, setActiveTab] = useState<"firm" | "security">("firm");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Firm Compliance Profile Form
  const [formData, setFormData] = useState({
    name: user?.name || "",
    companyName: user?.companyProfile?.companyName || user?.name || "",
    pan: user?.companyProfile?.pan || "",
    gstin: user?.companyProfile?.gstin || "",
    udin: user?.companyProfile?.udin || "",
    frn: user?.companyProfile?.frn || "",
    din: user?.companyProfile?.din || "",
    tan: user?.companyProfile?.tan || "",
    address: user?.companyProfile?.address || "",
    phone: user?.phone || "",
  });

  // Passkey enrollment
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        companyName: user.companyProfile?.companyName || user.name || "",
        pan: user.companyProfile?.pan || "",
        gstin: user.companyProfile?.gstin || "",
        udin: user.companyProfile?.udin || "",
        frn: user.companyProfile?.frn || "",
        din: user.companyProfile?.din || "",
        tan: user.companyProfile?.tan || "",
        address: user.companyProfile?.address || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleSaveFirmProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const companyProfileData: CompanyProfile = {
        companyName: formData.companyName.trim(),
        pan: formData.pan.trim().toUpperCase() || undefined,
        gstin: formData.gstin.trim().toUpperCase() || undefined,
        udin: formData.udin.trim().toUpperCase() || undefined,
        frn: formData.frn.trim().toUpperCase() || undefined,
        din: formData.din.trim().toUpperCase() || undefined,
        tan: formData.tan.trim().toUpperCase() || undefined,
        address: formData.address.trim() || undefined,
      };

      const updated = await UserService.updateUser(user.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim() || undefined,
        companyProfile: isCompany ? companyProfileData : undefined,
      });

      setUser({
        ...user,
        name: updated.name,
        phone: updated.phone,
        companyProfile: updated.companyProfile || user.companyProfile,
      });

      setSuccessMsg("Firm details updated successfully!");
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      setErrorMsg(err.response?.data?.error || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegisterPasskey = async () => {
    setPasskeyLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const optionsRes = await api.post("/auth/passkeys/reg-options");
      const attResp = await startRegistration({ optionsJSON: optionsRes.data });
      await api.post("/auth/passkeys/reg-verify", attResp);

      setSuccessMsg("Passkey registered successfully! You can now sign in with biometric authentication.");
    } catch (err: any) {
      console.error("Passkey registration failed:", err);
      setErrorMsg(err.response?.data?.error || "Failed to register passkey");
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-primary">Firm Settings & Security</h1>
        <p className="text-sm text-tertiary">
          Configure statutory compliance credentials (PAN, GSTIN, UDIN), firm profile, and biometric security.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-secondary">
        <button
          onClick={() => setActiveTab("firm")}
          className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "firm"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-tertiary hover:text-primary"
          }`}
        >
          {isCompany ? "Firm Compliance Profile" : "Personal Profile"}
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-5 py-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
            activeTab === "security"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-tertiary hover:text-primary"
          }`}
        >
          Security & Passkeys
        </button>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-600 flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-error_subtle bg-error-primary/10 p-3.5 text-xs text-error-primary flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tab 1: Firm Profile */}
      {activeTab === "firm" && (
        <form onSubmit={handleSaveFirmProfile} className="space-y-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-base font-bold text-primary flex items-center gap-2">
              <Building2 className="size-4 text-brand-primary" />
              General Organization Details
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary">Firm / Organization Legal Name *</label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2 text-xs text-primary focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary">Admin / Contact Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2 text-xs text-primary focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary">Primary Phone / Mobile</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2 text-xs text-primary focus:border-brand-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-primary">Registered Office Address</label>
                <input
                  type="text"
                  placeholder="e.g. 101, Business Towers, Mumbai, MH"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2 text-xs text-primary focus:border-brand-primary focus:outline-none"
                />
              </div>
            </div>
          </Card>

          {/* Statutory Compliance Identifiers (Company Only) */}
          {isCompany && (
            <Card className="p-6 space-y-4">
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-500" />
                Statutory & ICAI / MCA Compliance Identifiers
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary">Firm PAN</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2 text-xs font-mono uppercase text-primary focus:border-brand-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary">GSTIN Number</label>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder="27ABCDE1234F1Z5"
                    value={formData.gstin}
                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2 text-xs font-mono uppercase text-primary focus:border-brand-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary">UDIN (Unique Doc Identifier)</label>
                  <input
                    type="text"
                    placeholder="24123456AAAAAA1234"
                    value={formData.udin}
                    onChange={(e) => setFormData({ ...formData, udin: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2 text-xs font-mono uppercase text-primary focus:border-brand-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary">Firm Registration No (FRN)</label>
                  <input
                    type="text"
                    placeholder="123456W"
                    value={formData.frn}
                    onChange={(e) => setFormData({ ...formData, frn: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2 text-xs font-mono uppercase text-primary focus:border-brand-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary">Director Ident No (DIN)</label>
                  <input
                    type="text"
                    placeholder="01234567"
                    value={formData.din}
                    onChange={(e) => setFormData({ ...formData, din: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2 text-xs font-mono uppercase text-primary focus:border-brand-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-primary">TAN Number</label>
                  <input
                    type="text"
                    placeholder="MUMB12345A"
                    value={formData.tan}
                    onChange={(e) => setFormData({ ...formData, tan: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-secondary bg-primary px-3.5 py-2 text-xs font-mono uppercase text-primary focus:border-brand-primary focus:outline-none"
                  />
                </div>
              </div>
            </Card>
          )}

          <div className="flex justify-end">
            <Button
              color="primary"
              onPress={() => handleSaveFirmProfile()}
              isDisabled={isSaving}
              iconLeading={<Save data-icon />}
            >
              {isSaving ? "Saving Changes..." : "Save Settings"}
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Security & Passkeys */}
      {activeTab === "security" && (
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                <Fingerprint className="size-5 text-brand-primary" />
                Passkey & Biometric Authentication
              </h2>
              <p className="text-xs text-tertiary mt-0.5">
                Sign in securely with Touch ID, Windows Hello, or your device lock without passwords.
              </p>
            </div>
            <Button
              color="primary"
              size="sm"
              onPress={handleRegisterPasskey}
              isDisabled={passkeyLoading}
              iconLeading={<Plus data-icon />}
            >
              {passkeyLoading ? "Registering..." : "Add Passkey"}
            </Button>
          </div>

          <div className="rounded-xl border border-secondary bg-secondary/10 p-4 text-xs text-secondary space-y-1">
            <p className="font-semibold text-primary">FIDO2 WebAuthn Passkeys</p>
            <p className="text-tertiary">
              Passkeys offer phishing-proof cryptographic security using hardware security chips built into your Apple, Android, or Windows laptop/phone.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
