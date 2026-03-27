import { Link, NavLink, Outlet } from 'react-router-dom'
import { appMenu } from '@/config/menu'

export function MainLayout() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="grid min-h-dvh grid-cols-1 md:grid-cols-[280px_1fr]">
        <aside className="hidden border-r bg-card md:block">
          <div className="flex h-dvh flex-col">
            <div className="border-b px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="grid size-9 place-items-center rounded-md border font-semibold">
                  W
                </div>
                <div>
                  <p className="text-sm font-semibold leading-none">WMS</p>
                  <p className="text-xs text-muted-foreground">Warehouse Management System</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-3">
              <div className="mb-3 px-2 text-xs font-medium text-muted-foreground">
                MENU
              </div>

              <div className="space-y-3">
                {appMenu.map((group) => (
                  <section key={group.key} className="space-y-1">
                    <p className="px-2 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </p>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon
                        return (
                          <NavLink
                            key={item.key}
                            to={item.path}
                            className={({ isActive }) =>
                              [
                                'flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors',
                                isActive
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                              ].join(' ')
                            }
                            end={item.path === '/'}
                          >
                            {Icon ? <Icon className="size-4" /> : null}
                            <span>{item.label}</span>
                          </NavLink>
                        )
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <div className="border-t px-4 py-3 text-xs text-muted-foreground">
              v0.0.0
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-none">WMS</p>
                <p className="truncate text-xs text-muted-foreground">
                  Tenant: <span className="font-medium text-foreground">Default</span>
                </p>
              </div>

              <nav className="flex shrink-0 items-center gap-4 text-sm">
                <Link className="hover:underline" to="/login">
                  Login
                </Link>
              </nav>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-4">
            <div className="mx-auto w-full max-w-6xl">
              <div className="rounded-lg border bg-card p-4">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
