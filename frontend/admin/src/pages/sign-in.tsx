import { useState } from "react";
import { ThemeToggle, Button } from "@origin-flow/ui";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate, Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { useAuthStore } from "../store/auth.store";
import { startAuthentication } from "@simplewebauthn/browser";

export function SignIn() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [emailForPasskey, setEmailForPasskey] = useState("");

  const handleSuccess = async (credentialResponse: any) => {
    try {
      setErrorMsg("");
      setIsLoading(true);
      const idToken = credentialResponse.credential;
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/google`, {
        idToken,
        role: "ADMIN"
      });

      const { user, token } = response.data;
      setAuth(user, token);
      navigate("/dashboard");
    } catch (error: any) {
      if (error.response?.status === 403 || error.response?.data?.error) {
        setErrorMsg(error.response.data.error || "Your role doesn't allow access. Please ask an admin to change your role.");
      } else {
        setErrorMsg("Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!emailForPasskey) {
      setErrorMsg("Please enter your email to use passkey.");
      return;
    }

    try {
      setPasskeyLoading(true);
      setErrorMsg("");

      const optionsRes = await axios.post(`${import.meta.env.VITE_API_URL}/auth/passkeys/auth-options`, {
        email: emailForPasskey,
      });

      const asseResp = await startAuthentication({ optionsJSON: optionsRes.data });

      const verifyRes = await axios.post(`${import.meta.env.VITE_API_URL}/auth/passkeys/auth-verify`, {
        email: emailForPasskey,
        credential: asseResp,
      });

      if (verifyRes.data?.token) {
        setAuth(verifyRes.data.user, verifyRes.data.token);
        navigate("/dashboard");
      } else {
        setErrorMsg("Passkey authentication failed.");
      }
    } catch (error: any) {
      if (error.name === "NotAllowedError") {
        setErrorMsg("Passkey authentication was cancelled.");
      } else {
        setErrorMsg(error.response?.data?.error || "Failed to authenticate with passkey.");
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left Column - Form */}
      <div className="flex flex-col gap-6 p-6 md:p-10 lg:p-12">
        {/* Header */}
        <div className="flex justify-between items-center w-full">
          <Link to="/" className="flex items-center gap-2.5 font-semibold text-lg">
            <img src="/logo.png" alt="Logo" className="h-7 w-7 dark:invert" />
            <span className="tracking-tight">Origin Flow.</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 py-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight dark:text-white text-black">
              Welcome back
            </h1>
            <p className="dark:text-zinc-400 text-zinc-600">
              Sign in to access the administrative panel
            </p>
          </div>

          <div className="w-full max-w-sm space-y-6 flex flex-col items-center">
            {errorMsg && (
              <div className="w-full p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl text-center border border-red-200 dark:border-red-800/30">
                {errorMsg}
              </div>
            )}
            
            <div className="w-full flex justify-center overflow-hidden rounded-full relative">
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm rounded-full">
                  <Loader2 className="h-5 w-5 animate-spin text-zinc-900 dark:text-zinc-100" />
                </div>
              )}
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => setErrorMsg("Google Sign-In was unsuccessful. Try again.")}
                useOneTap
                theme="outline"
                shape="pill"
                size="large"
                text="signin_with"
                width="384"
              />
            </div>
            
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-zinc-950 px-2 text-zinc-500">Or sign in with passkey</span>
              </div>
            </div>

            <div className="w-full space-y-4">
              <input
                type="email"
                placeholder="Enter your email for passkey"
                value={emailForPasskey}
                onChange={(e) => setEmailForPasskey(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent p-4 text-sm placeholder:text-zinc-400"
              />
              <Button
                onClick={handlePasskeyLogin}
                isDisabled={passkeyLoading || !emailForPasskey}
                className="w-full py-4 rounded-full"
              >
                {passkeyLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <></>
                )}
                Use Passkey
              </Button>
            </div>
          </div>

          <p className="text-xs dark:text-zinc-500/60 text-zinc-500/60 max-w-xs text-center leading-relaxed">
            This is an administrative sign-in page. If you're not an administrator
            or need assistance, please contact support.
          </p>
        </div>
      </div>

      <div className="relative hidden bg-zinc-100 dark:bg-zinc-900 lg:block overflow-hidden">
        <img
          src="https://i.pinimg.com/originals/95/3c/30/953c30834f6dca6ee8a392328123b7be.jpg"
          alt="Administrative access"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.8] dark:grayscale transition-all"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
      </div>
    </div>
  )
}