import React, { ReactNode } from "react";
import TopNav from "./TopNav";

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div 
            className="min-h-screen text-foreground" 
            style={{ backgroundColor: 'var(--background)' }}
        >
            <TopNav />
            <main className="container mx-auto p-6">{children}</main>
        </div>
    );
};

export default Layout;
