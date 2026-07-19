import { Button } from "@origin-flow/ui";
import { isRouteErrorResponse, useRouteError, Link, useNavigate } from "react-router-dom";

export function ErrorBoundaryPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  let errorMessage = "An unexpected error occurred.";

  if (isRouteErrorResponse(error)) {
    errorMessage = error.statusText || error.data;
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="fixed inset-0 grid grid-cols-1 lg:grid-cols-2 bg-primary">
      <div className="flex flex-col items-center justify-center px-6 sm:px-12 lg:px-16 xl:px-20 py-10 lg:py-0">
        <span className="text-rose-600 dark:text-rose-400 text-base sm:text-lg font-semibold tracking-wider uppercase">
          Application Error
        </span>
        <h1 className="text-gray-950 dark:text-white text-4xl/snug sm:text-6xl/tight lg:text-5xl/tight xl:text-6xl/tight font-bold text-center lg:text-left mt-4">
          Oops! Something went wrong
        </h1>
        <p className="mt-6 text-gray-600 dark:text-gray-400 text-base sm:text-lg text-center lg:text-left max-w-md">
          Sorry, an unexpected error has occurred. Please try going back or return to the dashboard.
        </p>
        <div className="mt-8 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg w-full max-w-md">
          <p className="font-mono text-sm text-red-800 dark:text-red-300 break-all">{errorMessage}</p>
        </div>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Button 
            size="lg" 
            className="w-full sm:w-auto px-8"
            onClick={() => navigate(-1)}
          >
            Go back
          </Button>
          <Link to="/">
            <Button size="lg" className="w-full sm:w-auto px-8" color="tertiary">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
      <div className="hidden lg:block relative h-full">
        <img
          src="https://i.pinimg.com/1200x/c7/7d/cb/c77dcbe5bca9c37cbac9b465f6d96a9c.jpg"
          alt="Error illustration"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r lg:bg-linear-to-l from-white/20 dark:from-black/20 to-transparent" />
      </div>
    </div>
  );
}