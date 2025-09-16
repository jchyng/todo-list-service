import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
  lg: "h-12 w-12",
};

export function UserAvatar({
  src,
  alt,
  name,
  size = "md",
  className = ""
}: UserAvatarProps) {
  const getInitial = (name?: string) => {
    if (!name) return "";
    return name.charAt(0).toUpperCase();
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback>
        {getInitial(name)}
      </AvatarFallback>
    </Avatar>
  );
}