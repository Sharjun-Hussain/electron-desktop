import { SidebarTrigger } from "./ui/sidebar";

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex items-center gap-3 border-b border-border bg-card pl-3 py-6">
      <SidebarTrigger />
      <div className="flex flex-1 flex-row  mr-8 justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
