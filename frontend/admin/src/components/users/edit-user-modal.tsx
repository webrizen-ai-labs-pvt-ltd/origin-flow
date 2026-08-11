import { useState, useEffect } from "react";
import { X, Building2, AlertCircle } from "lucide-react";
import { Button } from "@origin-flow/ui";
import { UserService, type UpdateUserPayload, type UserSummary } from "../../services/user-service";

interface EditUserModalProps {
  isOpen: boolean;
  user: UserSummary | null;
  onClose: () => void;
  onSuccess: (updatedUser: UserSummary) => void;
}

export function EditUserModal({ isOpen, user, onClose, onSuccess }: EditUserModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Company Profile fields (if role === COMPANY)
  const [companyName, setCompanyName] = useState("");
  const [pan, setPan] = useState("");
  const [gstin, setGstin] = useState("");
  const [udin, setUdin] = useState("");
  const [frn, setFrn] = useState("");
  const [din, setDin] = useState("");
  const [tan, setTan] = useState("");
  const [address, setAddress] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAvatarUrl(user.avatarUrl || "");

      if (user.companyProfile) {
        setCompanyName(user.companyProfile.companyName || "");
        setPan(user.companyProfile.pan || "");
        setGstin(user.companyProfile.gstin || "");
        setUdin(user.companyProfile.udin || "");
        setFrn(user.companyProfile.frn || "");
        setDin(user.companyProfile.din || "");
        setTan(user.companyProfile.tan || "");
        setAddress(user.companyProfile.address || "");
      } else {
        setCompanyName("");
        setPan("");
        setGstin("");
        setUdin("");
        setFrn("");
        setDin("");
        setTan("");
        setAddress("");
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg("");

    const payload: UpdateUserPayload = {
      name: name.trim(),
      phone: phone.trim() || null,
      avatarUrl: avatarUrl.trim() || null,
      companyProfile:
        user.role === "COMPANY"
          ? {
              companyName: companyName.trim() || name.trim(),
              pan: pan.trim() ? pan.trim().toUpperCase() : null,
              gstin: gstin.trim() ? gstin.trim().toUpperCase() : null,
              udin: udin.trim() || null,
              frn: frn.trim() || null,
              din: din.trim() || null,
              tan: tan.trim() || null,
              address: address.trim() || null,
            }
          : undefined,
    };

    try {
      setIsSubmitting(true);
      const updated = await UserService.updateUser(user.id, payload);
      onSuccess(updated);
      onClose();
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || "Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-xl rounded-2xl border border-secondary bg-primary shadow-2xl transition-all my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-secondary px-6 py-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-primary">Edit User Profile</h2>
            <p className="text-xs text-tertiary">Editing account: {user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-fg-quaternary hover:bg-primary_hover hover:text-secondary transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-lg border border-error_subtle bg-error-primary/10 p-3 text-sm text-error-primary">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand-solid focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand-solid focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Avatar Image URL</label>
              <input
                type="url"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand-solid focus:outline-hidden"
              />
            </div>
          </div>

          {/* Company Profile fields */}
          {user.role === "COMPANY" && (
            <div className="rounded-xl border border-secondary p-4 space-y-3 bg-secondary/20">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Building2 className="size-4 text-brand-secondary" />
                <span>Company Compliance Information</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Company / Firm Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand-solid focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">PAN Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary uppercase focus:border-brand-solid focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">GSTIN</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary uppercase focus:border-brand-solid focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">UDIN</label>
                  <input
                    type="text"
                    value={udin}
                    onChange={(e) => setUdin(e.target.value)}
                    className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand-solid focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">FRN</label>
                  <input
                    type="text"
                    value={frn}
                    onChange={(e) => setFrn(e.target.value)}
                    className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand-solid focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1">DIN</label>
                  <input
                    type="text"
                    value={din}
                    onChange={(e) => setDin(e.target.value)}
                    className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand-solid focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-secondary mb-1">Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand-solid focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary shrink-0">
            <Button color="secondary" size="md" onPress={onClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button color="primary" size="md" type="submit" isLoading={isSubmitting}>
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
