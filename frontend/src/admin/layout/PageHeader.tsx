import React from 'react';

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  return (
    <header className="admin-page-header">
      {breadcrumbs && breadcrumbs.length > 0 ? (
        <nav className="admin-crumbs" aria-label="Sayfa konumu">
          {breadcrumbs.map((c, i) => (
            <span key={`${c.label}-${i}`}>
              {i > 0 ? <span aria-hidden="true"> / </span> : null}
              {c.href ? <a href={c.href}>{c.label}</a> : <span>{c.label}</span>}
            </span>
          ))}
        </nav>
      ) : null}
      <div className="admin-page-header-row">
        <div>
          <h1 data-testid="admin-page-title">{title}</h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="admin-page-actions">{actions}</div> : null}
      </div>
    </header>
  );
}
