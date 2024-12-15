import React, { ReactNode } from "react";
import TopNav from "./TopNav";

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div>
            <TopNav />
            <main className="p-6">{children}</main>
        </div>
    );
};

export default Layout;
