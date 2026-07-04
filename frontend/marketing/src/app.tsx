import { Button, Card } from "@origin-flow/ui";

export function App() {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-black px-4  text-zinc-100 overflow-hidden">
      <img src="https://i.pinimg.com/736x/03/01/9f/03019fcffdc6e6d797f95500b6083365.jpg" alt="Background Hero" className="absolute inset-0 z-0 h-screen w-full object-cover invert" />
      <div className="z-10 flex max-w-4xl flex-col items-center text-center relative">

       <div className="flex gap-3 items-center mb-8">
         <img src="/logo.png" alt="Logo" className="size-14 invert" />
         <span className="text-5xl font-black">+</span>
        <img src="/webrizen.png" alt="Logo" className="size-14" />
       </div>

        <div className="mb-6 inline-flex items-center rounded-sm border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs font-medium text-zinc-400">
          <span className="mr-2 h-1.5 w-1.5 bg-zinc-500"></span>
          Origin Flow Early Access
        </div>

        <h1 className="mb-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl font-syne">
          The single source of truth for <br className="hidden sm:block" />
          modern CA firms.
        </h1>

        <p className="mb-10 max-w-xl text-lg text-zinc-400">
          Replace chaotic email chains and messy document folders with a secure,
          ticketing timeline designed specifically for Chartered Accountants.
        </p>

        <Card className="w-full max-w-md rounded-sm border border-zinc-800 bg-black p-2 shadow-none">
          <form
            className="flex w-full items-center gap-2"
            action="https://formsubmit.co/hello@webrizen.com"
            method="POST"
          >
            <input
              name="email"
              type="email"
              placeholder="Enter your work email"
              className="flex-1 rounded-sm border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:border-zinc-500 focus:bg-zinc-900"
              required
            />
            <Button
              color="primary"
              className="rounded-sm shadow-none"
              type="submit"
            >
              Join Waitlist
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-xs text-zinc-600">
          Limited spots available for the private beta. <span className="text-xs text-zinc-500 pl-3 ml-3 border-l border-zinc-600/50">A Webrizen AI Labs Pvt Ltd. product</span>
        </p>
      </div>
    </div>
  );
}