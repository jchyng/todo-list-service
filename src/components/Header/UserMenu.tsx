import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/UserAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/contexts/AuthContext";

export function UserMenu() {
  const { user, loading, signOut } = useAuthContext();

  return (
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
  );
}