import { Search, Calendar, CheckSquare, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";

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
  const { user, loading, signOut } = useAuthContext();
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
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="작업 검색..."
              className="pl-10"
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>

        {/* Navigation & User Menu */}
        <div className="flex items-center">
          {/* Navigation Menu */}
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onPageChange?.("todo");
                navigate("/todo");
              }}
              className={`hover:cursor-pointer ${
                currentPage === "todo"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckSquare className="h-4 w-4" /> Todo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onPageChange?.("calendar");
                navigate("/calendar");
              }}
              className={`hover:cursor-pointer ${
                currentPage === "calendar"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="h-4 w-4" /> Calendar
            </Button>
          </div>

          {/* User Avatar & Dropdown */}
          <div className="ml-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                  disabled={loading}
                >
                  <UserAvatar
                    src={user?.user_metadata?.avatar_url}
                    alt={user?.user_metadata?.full_name}
                    name={user?.user_metadata?.full_name}
                    size="md"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex flex-col space-y-1 p-2">
                  <div className="flex items-center space-x-2">
                    <UserAvatar
                      src={user?.user_metadata?.avatar_url}
                      alt={user?.user_metadata?.full_name}
                      name={user?.user_metadata?.full_name}
                      size="sm"
                    />
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">
                        {user?.user_metadata?.full_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} disabled={loading}>
                  <LogOut className="mr-2 h-4 w-4 " />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
