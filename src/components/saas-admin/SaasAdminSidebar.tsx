import {
  LayoutDashboard, Building2, CreditCard, Package, Puzzle, Receipt,
  Sparkles, BarChart3, Globe, Settings, LogOut, Megaphone, KeyRound, Store, ChevronDown, Palette
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const mainItems = [
  { title: "Dashboard", url: "/saas-admin/dashboard", icon: LayoutDashboard },
  { title: "Tenants", url: "/saas-admin/tenants", icon: Building2 },
  { title: "Subscriptions", url: "/saas-admin/subscriptions", icon: CreditCard },
  { title: "Plans & Packages", url: "/saas-admin/plans", icon: Package },
  { title: "Features", url: "/saas-admin/features", icon: Puzzle },
  { title: "Transactions", url: "/saas-admin/transactions", icon: Receipt },
];

const secondaryItems = [
  { title: "AI Usage", url: "/saas-admin/ai-usage", icon: Sparkles },
  { title: "Analytics", url: "/saas-admin/analytics", icon: BarChart3 },
  { title: "Domains", url: "/saas-admin/domains", icon: Globe },
  { title: "Envato licenses", url: "/saas-admin/envato-licenses", icon: KeyRound },
  { title: "Announcements", url: "/saas-admin/announcements", icon: Megaphone },
  { title: "Settings", url: "/saas-admin/settings", icon: Settings },
];

const marketplaceSubItems = [
  { title: "Catalog", url: "/saas-admin/marketplace", icon: Store },
  { title: "All Themes", url: "/saas-admin/themes", icon: Palette },
  { title: "Upload Theme", url: "/saas-admin/themes/upload", icon: Package },
  { title: "Theme Docs", url: "/saas-admin/themes/docs", icon: Puzzle },
];

interface Props {
  onSignOut: () => void;
}

function SubMenu({ label, icon: Icon, items, collapsed }: { label: string; icon: any; items: typeof marketplaceSubItems; collapsed: boolean }) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path || pathname.startsWith(path + "/");
  const hasActive = items.some((i) => isActive(i.url));
  const [open, setOpen] = useState(hasActive);

  if (collapsed) {
    return (
      <>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive(item.url)}>
              <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                <item.icon className="mr-2 h-4 w-4" />
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className={cn("justify-between w-full shadow-none hover:bg-muted/50 transition-all", hasActive && "text-primary font-medium")}>
            <span className="flex items-center">
              <Icon className="mr-2 h-4 w-4" />
              <span>{label}</span>
            </span>
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")} />
          </SidebarMenuButton>
        </CollapsibleTrigger>
      </SidebarMenuItem>
      <CollapsibleContent>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive(item.url)} className="pl-8">
              <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                <item.icon className="mr-2 h-4 w-4" />
                <span className="flex-1">{item.title}</span>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function SaasAdminSidebar({ onSignOut }: Props) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {!collapsed && <span className="text-base font-bold tracking-tight">SaaS Admin</span>}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{!collapsed && "Platform"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SubMenu label="Marketplace" icon={Store} items={marketplaceSubItems} collapsed={collapsed} />
              
              {secondaryItems.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end className="hover:bg-muted/50" activeClassName="bg-muted text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button variant="ghost" size="sm" onClick={onSignOut} className="w-full justify-start text-muted-foreground">
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Sign Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
