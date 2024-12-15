import { useState, useEffect } from "react";
import { FaSun, FaMoon } from "react-icons/fa";

export default function ThemeToggle() {
    const [theme, setTheme] = useState("light");

    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    return (
        <div
            className="flex items-center cursor-pointer p-2 bg-gray-200 dark:bg-cyan-700 rounded-full w-16 h-8 relative"
            onClick={toggleTheme}
        >
            <div
                className={`absolute w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                    theme === "light" ? "translate-x-1" : "translate-x-9"
                }`}
            ></div>
            <FaSun
                className="absolute left-1 top-1/2 transform -translate-y-1/2 text-yellow-500"
                size={16}
            />
            <FaMoon
                className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-500"
                size={16}
            />
        </div>
    );
}
