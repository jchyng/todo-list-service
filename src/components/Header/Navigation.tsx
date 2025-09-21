import { Calendar, CheckSquare, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface NavigationButtonProps {
  page: "todo" | "calendar";
  currentPage: "todo" | "calendar";
  icon: LucideIcon;
  label: string;
  onPageChange?: (page: "todo" | "calendar") => void;
}

function NavigationButton({
  page,
  currentPage,
  icon: Icon,
  label,
  onPageChange,
}: NavigationButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    onPageChange?.(page);
    navigate(`/${page}`);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      className={`hover:cursor-pointer ${
        currentPage === page
          ? "bg-black text-white"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </Button>
  );
}

interface NavigationProps {
  currentPage?: "todo" | "calendar";
  onPageChange?: (page: "todo" | "calendar") => void;
}

export function Navigation({
  currentPage = "todo",
  onPageChange,
}: NavigationProps) {
  return (
    <div className="flex items-center space-x-1">
      <NavigationButton
        page="todo"
        currentPage={currentPage}
        icon={CheckSquare}
        label="Todo"
        onPageChange={onPageChange}
      />
      <NavigationButton
        page="calendar"
        currentPage={currentPage}
        icon={Calendar}
        label="Calendar"
        onPageChange={onPageChange}
      />
    </div>
  );
}
