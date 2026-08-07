import { Link, useLocation } from "react-router-dom";
import { ThemeToggle } from "@origin-flow/ui";
import { Menu } from "lucide-react";
import { useSidebar } from "./sidebar";

export function TopBar() {
  const { toggle } = useSidebar();
  const location = useLocation();

  const getBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter(Boolean);

    const breadcrumbs = paths.map((path, index) => {
      const formattedName = path
        .split("-")
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(" ");

      const href = "/" + paths.slice(0, index + 1).join("/");

      return {
        name: formattedName,
        href,
        isLast: index === paths.length - 1,
      };
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-secondary bg-primary/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg p-2 text-fg-quaternary transition-colors duration-200 hover:bg-primary_hover hover:text-fg-quaternary_hover lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="size-5" />
        </button>

        <nav
          aria-label="Breadcrumb"
          className="hidden items-center gap-2 text-sm sm:flex"
        >
          <ol className="flex items-center gap-2">
            <li>
              <Link
                to="/"
                className="text-tertiary hover:text-primary transition-colors duration-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="size-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776"
                  />
                </svg>
              </Link>
            </li>

            {breadcrumbs.map((breadcrumb) => (
              <li key={breadcrumb.href} className="flex items-center gap-2">
                <span className="text-quaternary">/</span>
                {breadcrumb.isLast ? (
                  <span className="font-medium text-primary">
                    {breadcrumb.name}
                  </span>
                ) : (
                  <Link
                    to={breadcrumb.href}
                    className="text-tertiary hover:text-primary transition-colors duration-200"
                  >
                    {breadcrumb.name}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  );
}
