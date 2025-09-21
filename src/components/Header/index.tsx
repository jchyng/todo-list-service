import { CheckSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SearchBar } from "./SearchBar";
import { Navigation } from "./Navigation";
import { UserMenu } from "./UserMenu";

interface HeaderProps {
  currentPage?: "todo" | "calendar";
  onPageChange?: (page: "todo" | "calendar") => void;
  onSearch?: (query: string) => void;
}

export function Header({
  currentPage = "todo",
  onPageChange,
  onSearch,
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div
          className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => navigate("/")}
        >
          <CheckSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">ToDo List</h1>
        </div>

        {/* Search Bar */}
        <SearchBar onSearch={onSearch} />

        {/* Navigation & User Menu */}
        <div className="flex items-center">
          <Navigation currentPage={currentPage} onPageChange={onPageChange} />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}