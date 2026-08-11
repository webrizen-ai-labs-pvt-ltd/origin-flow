import { useState, useEffect } from "react";
import { X, Building2, User, Mail, Shield, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@origin-flow/ui";
import { UserService, type CreateUserPayload, type UserSummary } from "../../services/user-service";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserSummary) => void;
}

export function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "COMPANY" | "MANAGER" | "CLIENT">("CLIENT");
  const [companyId, setCompanyId] = useState("");
  const [companies, setCompanies] = useState<UserSummary[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  // Company Profile fields (if role === COMPANY)
  const [showCompanyFields, setShowCompanyFields] = useState(true);
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && (role === "MANAGER" || role === "CLIENT")) {
      loadCompanies();
    }
  }, [isOpen, role]);

  const loadCompanies = async () => {
    try {
      setIsLoadingCompanies(true);
      const list = await UserService.getCompanies();
      setCompanies(list);
      if (list.length > 0 && !companyId) {
        setCompanyId(list[0].id);
      }
    } catch (e) {
      console.error("Failed to load companies", e);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setFieldErrors({});

    if (!name.trim()) {
      setFieldErrors((prev) => ({ ...prev, name: "Name is required" }));
      return;
    }
    if (!email.trim()) {
      setFieldErrors((prev) => ({ ...prev, email: "Email is required" }));
      return;
    }
    if ((role === "MANAGER" || role === "CLIENT") && !companyId) {
      setErrorMsg("Managers and Clients must be linked to a company account.");
      return;
    }
    if (role === "COMPANY" && !companyName.trim()) {
      setFieldErrors((prev) => ({ ...prev, companyName: "Company Name is required" }));
      return;
    }

    const payload: CreateUserPayload = {
      name: name.trim(),
      email: email.trim(),
      role,
      companyId: role === "MANAGER" || role === "CLIENT" ? companyId : null,
      companyProfile:
        role === "COMPANY"
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
      const created = await UserService.createUser(payload);
      onSuccess(created);
      handleClose();
    } catch (error: any) {
      const data = error.response?.data;
      if (data?.details && Array.isArray(data.details)) {
        const errors: Record<string, string> = {};
        data.details.forEach((item: { field: string; message: string }) => {
          errors[item.field] = item.message;
        });
        setFieldErrors(errors);
        setErrorMsg(data.error || "Please fix validation errors.");
      } else {
        setErrorMsg(data?.error || "Failed to create user. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setRole("CLIENT");
    setCompanyId("");
    setCompanyName("");
    setPan("");
    setGstin("");
    setUdin("");
    setFrn("");
    setDin("");
    setTan("");
    setAddress("");
    setErrorMsg("");
    setFieldErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-secondary bg-primary shadow-2xl transition-all my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-secondary px-6 py-4 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-primary">Create New User</h2>
            <p className="text-xs text-tertiary">Add a new organization, team member, or client</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-fg-quaternary hover:bg-primary_hover hover:text-secondary transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-lg border border-error_subtle bg-error-primary/10 p-3.5 text-sm text-error-primary">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Basic Info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">
                Full Name <span className="text-error-primary">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary placeholder:text-placeholder focus:border-brand-solid focus:outline-hidden focus:ring-1 focus:ring-brand-solid"
                />
              </div>
              {fieldErrors["name"] && (
                <p className="mt-1 text-xs text-error-primary">{fieldErrors["name"]}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-secondary mb-1.5">
                Email Address <span className="text-error-primary">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary placeholder:text-placeholder focus:border-brand-solid focus:outline-hidden focus:ring-1 focus:ring-brand-solid"
              />
              {fieldErrors["email"] && (
                <p className="mt-1 text-xs text-error-primary">{fieldErrors["email"]}</p>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-medium text-secondary mb-1.5">
              User Role <span className="text-error-primary">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["ADMIN", "COMPANY", "MANAGER", "CLIENT"] as const).map((r) => {
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={[
                      "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all cursor-pointer",
                      isSelected
                        ? "border-brand-solid bg-brand-solid/10 text-brand-secondary font-semibold ring-1 ring-brand-solid"
                        : "border-secondary bg-primary text-secondary hover:bg-primary_hover",
                    ].join(" ")}
                  >
                    {r === "ADMIN" && <Shield className="size-4" />}
                    {r === "COMPANY" && <Building2 className="size-4" />}
                    {r === "MANAGER" && <User className="size-4" />}
                    {r === "CLIENT" && <Mail className="size-4" />}
                    <span>{r}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Company Assignment for Manager / Client */}
          {(role === "MANAGER" || role === "CLIENT") && (
            <div className="rounded-xl border border-secondary bg-secondary/30 p-4 space-y-2">
              <label className="block text-xs font-medium text-secondary">
                Assign to Parent Company <span className="text-error-primary">*</span>
              </label>
              {isLoadingCompanies ? (
                <p className="text-xs text-tertiary">Loading available companies...</p>
              ) : companies.length === 0 ? (
                <p className="text-xs text-error-primary">
                  No COMPANY accounts found. Please create a COMPANY account first.
                </p>
              ) : (
                <select
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand-solid focus:outline-hidden focus:ring-1 focus:ring-brand-solid"
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyProfile?.companyName || c.name} ({c.email})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Company Compliance Profile for COMPANY role */}
          {role === "COMPANY" && (
            <div className="rounded-xl border border-secondary overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCompanyFields(!showCompanyFields)}
                className="flex w-full items-center justify-between bg-secondary/40 px-4 py-2.5 text-xs font-semibold text-secondary hover:bg-secondary/60 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Building2 className="size-4 text-brand-secondary" />
                  Corporate Compliance & Profile Details
                </span>
                {showCompanyFields ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>

              {showCompanyFields && (
                <div className="p-4 space-y-4 bg-primary">
                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1">
                      Company / Firm Name <span className="text-error-primary">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Audit LLP"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand-solid focus:outline-hidden"
                    />
                    {fieldErrors["companyProfile.companyName"] && (
                      <p className="mt-1 text-xs text-error-primary">
                        {fieldErrors["companyProfile.companyName"]}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-secondary mb-1">PAN Number</label>
                      <input
                        type="text"
                        placeholder="e.g. ABCDE1234F"
                        maxLength={10}
                        value={pan}
                        onChange={(e) => setPan(e.target.value.toUpperCase())}
                        className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary uppercase focus:border-brand-solid focus:outline-hidden"
                      />
                      {fieldErrors["companyProfile.pan"] && (
                        <p className="mt-1 text-xs text-error-primary">{fieldErrors["companyProfile.pan"]}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-secondary mb-1">GSTIN</label>
                      <input
                        type="text"
                        placeholder="e.g. 27ABCDE1234F1Z5"
                        maxLength={15}
                        value={gstin}
                        onChange={(e) => setGstin(e.target.value.toUpperCase())}
                        className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary uppercase focus:border-brand-solid focus:outline-hidden"
                      />
                      {fieldErrors["companyProfile.gstin"] && (
                        <p className="mt-1 text-xs text-error-primary">{fieldErrors["companyProfile.gstin"]}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium text-secondary mb-1">UDIN</label>
                      <input
                        type="text"
                        placeholder="UDIN"
                        value={udin}
                        onChange={(e) => setUdin(e.target.value)}
                        className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand-solid focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-secondary mb-1">FRN (Firm Reg No)</label>
                      <input
                        type="text"
                        placeholder="FRN"
                        value={frn}
                        onChange={(e) => setFrn(e.target.value)}
                        className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand-solid focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-secondary mb-1">DIN</label>
                      <input
                        type="text"
                        placeholder="Director DIN"
                        value={din}
                        onChange={(e) => setDin(e.target.value)}
                        className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand-solid focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-secondary mb-1">Registered Address</label>
                    <textarea
                      rows={2}
                      placeholder="Corporate office address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-lg border border-secondary bg-primary px-3 py-2 text-sm text-primary focus:border-brand-solid focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-secondary shrink-0">
            <Button color="secondary" size="md" onPress={handleClose} isDisabled={isSubmitting}>
              Cancel
            </Button>
            <Button color="primary" size="md" type="submit" isLoading={isSubmitting}>
              Create User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
