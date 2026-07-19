import { Button } from "@origin-flow/ui";
import { Link, useNavigate } from "react-router-dom";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 grid grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center px-6 sm:px-12 lg:px-16 xl:px-20 py-10 lg:py-0">
        <span className="text-rose-600 dark:text-rose-400 text-base sm:text-lg font-semibold tracking-wider uppercase">
          404 Error
        </span>
        <h1 className="text-gray-950 dark:text-white text-4xl/snug sm:text-6xl/tight lg:text-5xl/tight xl:text-6xl/tight font-bold text-center lg:text-left mt-4">
          Page not found
        </h1>
        <p className="mt-6 text-gray-600 dark:text-gray-400 text-base sm:text-lg text-center lg:text-left max-w-md">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link to="/">
            <Button size="lg" className="w-full sm:w-auto px-8" onClick={() => navigate(-1)}>
              Go back
            </Button>
          </Link>
          <a href="https://webrizen.com/contact" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="w-full sm:w-auto px-8" color="tertiary">
              Contact support
            </Button>
          </a>
        </div>
      </div>
      <div className="hidden lg:block relative h-full">
        <img
          src="https://i.pinimg.com/1200x/75/81/a4/7581a4357f8a9a75f09fb37fc0392d4c.jpg"
          alt="Lost in space illustration"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-r lg:bg-linear-to-l from-white/20 dark:from-black/20 to-transparent" />
      </div>
    </div>
  );
}