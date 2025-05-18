import { useEffect } from "react";
import useClientSideStorage from "../hooks/useClientSideStorage";
import { FaSun, FaMoon } from "react-icons/fa";

type Theme = "light" | "dark";

export default function ThemeToggle() {
    const [theme, setTheme, isLoading] = useClientSideStorage<Theme>("theme", "dark");

    // Apply theme to HTML element
    useEffect(() => {
        if (!isLoading) {
            // Apply the theme to the HTML element via data-theme attribute
            document.documentElement.setAttribute("data-theme", theme);
            
            // Handle Tailwind dark mode class
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [theme, isLoading]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    if (isLoading) return null;

    return (
        <div
            className="relative flex items-center w-16 h-8 bg-blue-500 rounded-full cursor-pointer"
            onClick={toggleTheme}
            role="button"
            tabIndex={0}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            <div
                className={`absolute w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-md ${
                    theme === "light" ? "translate-x-1" : "translate-x-9"
                }`}
            ></div>

            <div className="absolute left-2 top-1/2 -translate-y-1/2">
                <FaSun className={`text-yellow-500 ${theme === "dark" ? "opacity-50" : "opacity-100"}`} size={16}/>
            </div>

            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <FaMoon className={`text-yellow-500 ${theme === "light" ? "opacity-50" : "opacity-100"}`} size={16}/>
            </div>
        </div>
    );
}
