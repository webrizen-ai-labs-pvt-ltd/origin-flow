import { Button, ThemeToggle } from "@origin-flow/ui";

export function App() {
  return (
    <div className="min-h-screen p-6 md:p-12 relative flex justify-center bg-primary">
      <div className="absolute top-16 right-52 z-30"><ThemeToggle /></div>
      <div className="container w-full space-y-12">

        <div className="rounded-xl overflow-hidden">
          <img
            src="https://i.pinimg.com/736x/6e/79/0f/6e790fbd1a0166e5b40338d024628330.jpg"
            alt="Team collaborating around a table"
            className="w-full h-[50vh] object-cover grayscale brightness-90"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 pt-4">

          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-syne dark:text-primary">
             Welcome to Origin Flow, <br /> Your Administration Area.
            </h1>
          </div>

          <div className="flex flex-col justify-end gap-6 lg:pb-1">
            <p className="text-primary/50 text-base md:text-lg leading-relaxed max-w-lg">
              This area is reserved for authorized personnel only. Please sign in to access your account or contact support if you need assistance.
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              <Button className="w-min whitespace-nowrap">Sign in</Button>
              <Button className="w-min whitespace-nowrap" color="tertiary">
                Contact Support
              </Button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
