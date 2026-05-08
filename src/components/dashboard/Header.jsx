"use client";

import { 
  Bell, Sun, Moon, LogOut, UserCircle, Settings, 
  Maximize, Minimize, ChevronDown, Building2
} from "lucide-react";
import { useTheme } from "next-themes";
import { useSession, signOut } from "@/components/auth/DesktopAuthProvider";
import { useRouter } from "next/navigation";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useSettings } from "@/app/hooks/swr/useSettings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAppSettings } from "@/app/hooks/useAppSettings";
import { getImageUrl } from "@/lib/utils";

export default function Header() {
  const { setTheme, theme } = useTheme();
  const { data: session } = useSession();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { business, general, refreshSettings } = useAppSettings();
  const { updateModularSettings } = useSettings();
  const router = useRouter();

  const handleThemeToggle = async () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (general) {
      await updateModularSettings('general', {
        ...general,
        interface: {
          ...(general.interface || {}),
          theme: newTheme
        }
      });
      if (refreshSettings) refreshSettings();
    }
  };

  // Build org logo URL — same approach as custom-sidebar.jsx
  const getOrgLogoUrl = () => {
    if (!business?.logo) return null;
    if (business.logo.startsWith("http")) return business.logo;
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "");
    return `${baseUrl}/${business.logo}`;
  };

  const orgName = business?.name || "My Store";
  const orgLogo = getOrgLogoUrl();
  const orgInitials = orgName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const getUserInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border">
      <div className="px-6 h-16 flex items-center justify-between">
        {/* Left Side: Organization Branding */}
        <div className="flex items-center gap-3">
          {orgLogo ? (
            <img
              src={orgLogo}
              alt={orgName}
              className="h-8 w-8 rounded-lg object-contain border border-border bg-muted"
            />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              {orgInitials ? (
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{orgInitials}</span>
              ) : (
                <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-foreground tracking-tight leading-none">{orgName}</h1>
            <span className="text-[11px] text-muted-foreground font-medium mt-0.5">Store Dashboard</span>
          </div>
        </div>

        {/* Right Side Actions: Default Styles */}
        <div className="flex items-center gap-2">
          
          <Button id="dashboard-notifications" variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
            <Bell className="w-5 h-5" />
          </Button>

          <Button 
            id="dashboard-theme-toggle"
            variant="ghost" 
            size="icon" 
            onClick={handleThemeToggle}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          <Button 
            id="dashboard-fullscreen"
            variant="ghost" 
            size="icon" 
            onClick={toggleFullscreen}
            className="text-muted-foreground hover:text-foreground hidden sm:flex"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </Button>

          <div className="h-6 w-px bg-border mx-2" />

          {/* User Profile: Simplified */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button id="dashboard-user-menu" className="flex items-center gap-3 p-1 rounded-full hover:bg-accent transition-colors outline-none group">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={getImageUrl(session?.user?.image)} />
                  <AvatarFallback className="text-[10px] font-bold">
                    {getUserInitials(session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-semibold text-foreground leading-none">
                    {session?.user?.name || "User Account"}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1 font-medium">
                    {session?.user?.roles?.[0]?.name || "System Admin"}
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground sm:block hidden" />
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">{session?.user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/profile")}>
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
