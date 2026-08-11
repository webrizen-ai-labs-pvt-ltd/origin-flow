import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@origin-flow/ui";
import { UserService, type UserSummary } from "../../services/user-service";

interface DeleteUserModalProps {
  isOpen: boolean;
  user: UserSummary | null;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
}

export function DeleteUserModal({ isOpen, user, onClose, onSuccess }: DeleteUserModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleDelete = async () => {
    if (!user) return;
    try {
      setIsDeleting(true);
      setErrorMsg("");
      await UserService.deleteUser(user.id);
      onSuccess(user.id);
      onClose();
    } catch (e: any) {
      setErrorMsg(e.response?.data?.error || "Failed to delete user.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in-0 duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-secondary bg-primary p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-fg-quaternary hover:bg-primary_hover hover:text-secondary transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-error-primary/10 text-error-primary">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-primary">Delete User Account</h3>
            <p className="text-xs text-tertiary">
              Are you sure you want to delete <span className="font-semibold text-primary">{user.name}</span> ({user.email})?
              This action cannot be undone and will revoke all active sessions and passkeys.
            </p>
          </div>
        </div>

        {errorMsg && (
          <p className="mt-3 rounded-lg border border-error_subtle bg-error-primary/10 p-2.5 text-xs text-error-primary">
            {errorMsg}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <Button color="secondary" size="md" onPress={onClose} isDisabled={isDeleting}>
            Cancel
          </Button>
          <Button color="primary-destructive" size="md" onPress={handleDelete} isLoading={isDeleting}>
            Yes, Delete User
          </Button>
        </div>
      </div>
    </div>
  );
}
