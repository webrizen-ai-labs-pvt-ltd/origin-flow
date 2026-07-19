import { Button, ThemeToggle } from "@origin-flow/ui";

export function SignIn() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Left Column - Form */}
      <div className="flex flex-col gap-6 p-6 md:p-10 lg:p-12">
        {/* Header */}
        <div className="flex justify-between items-center w-full">
          <a href="#" className="flex items-center gap-2.5 font-semibold text-lg">
            <img src="/logo.png" alt="Logo" className="h-7 w-7 dark:invert" />
            <span className="tracking-tight">Origin Flow.</span>
          </a>
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

          <form className="w-full max-w-sm space-y-4">
            <div className="space-y-0">
              <input
                type="email"
                placeholder="Email address"
                className="w-full px-4 py-3.5 border-x border-t dark:border-zinc-700 border-zinc-300 rounded-t-xl focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-black dark:focus:border-white transition-colors dark:bg-zinc-900 bg-white dark:text-white text-black placeholder:dark:text-zinc-500 placeholder:text-zinc-400"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-3.5 border dark:border-zinc-700 border-zinc-300 rounded-b-xl focus:outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 focus:border-black dark:focus:border-white transition-colors dark:bg-zinc-900 bg-white dark:text-white text-black placeholder:dark:text-zinc-500 placeholder:text-zinc-400"
              />
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-sm dark:text-zinc-400 text-zinc-600 hover:dark:text-white hover:text-black transition-colors">
                Forgot password?
              </a>
            </div>

            <Button className="w-full rounded-full" size="xl">
              Sign In
            </Button>
          </form>

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