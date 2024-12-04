// Mock CSS Modules
const cssModule = new Proxy(
  {},
  {
    get: () => 'mock-css-module'
  }
);

// Mock CSS files
const cssFile = `
:root {
  --bg-dark: #0c0e10;
  --bg-light: #292929;
  --bg-input: #393939;
  --bg-workspace: #1f2228;
  --border: #3c3c4a;
  --text-editor-base: #9099AC;
  --text-editor-active: #C4CBDA;
  --bg-editor-sidebar: #24272E;
  --bg-editor-active: #31343D;
  --border-editor-sidebar: #3C3C4A;
  --bg-neutral-muted: #afb8c133;
}

.filter-group select,
.filter-group input {
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 1rem;
  background-color: var(--bg-input) !important;
  color: var(--text-editor-active) !important;
  min-width: 120px;
}

.filter-group input[type="date"]::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.5rem;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
}

.pagination button {
  padding: 0.5rem 1rem;
  background-color: var(--bg-input) !important;
  color: var(--text-editor-active) !important;
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination button:not(:disabled):hover {
  background: var(--bg-editor-active);
}

.pagination .page-info {
  color: var(--text-editor-base) !important;
  padding: 0.5rem 1rem;
}
`;

// Create a style element and append it to the document head
const style = document.createElement('style');
style.textContent = cssFile;
document.head.appendChild(style);

// Add pseudo-element styles
const pseudoStyles = document.createElement('style');
pseudoStyles.textContent = `
  .filter-group input[type="date"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
  }

  .pagination button:not(:disabled):hover {
    background-color: var(--bg-editor-active) !important;
  }
`;
document.head.appendChild(pseudoStyles);

// Mock CSS imports
vi.mock('*.css', () => cssModule);
vi.mock('*.scss', () => cssModule);
vi.mock('*.sass', () => cssModule);
vi.mock('*.less', () => cssModule);