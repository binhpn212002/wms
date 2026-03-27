export function PlaceholderPage({ title, description }) {
  return (
    <section className="space-y-2">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          {description || 'Trang này đang được triển khai.'}
        </p>
      </header>
    </section>
  )
}

