import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Menu, X } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  onMenuToggle?: () => void;
  showMenuButton?: boolean;
}

export default function Header({ onMenuToggle, showMenuButton = true }: HeaderProps) {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    onMenuToggle?.();
  };

  return (
    <header className="lg:hidden bg-card border-b border-border p-4 flex items-center justify-between" data-testid="header-mobile">
      {showMenuButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMenuToggle}
          data-testid="button-mobile-menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </Button>
      )}
      
      <h1 className="text-lg font-semibold text-card-foreground">EmotiCare</h1>
      
      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
        <span className="text-sm font-medium text-muted-foreground">
          {user ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
        </span>
      </div>
    </header>
  );
}
