'use client';

import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useApolloClient } from '@apollo/client';
import {
  ArrowDownTrayIcon,
  ArrowsUpDownIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { useDataExportTables } from '@/hooks/useDataExportTables';
import { useDataExportUnsupported } from '@/hooks/useDataExportUnsupported';
import {
  DATA_EXPORT_SCOPE_LABELS,
  DATA_EXPORT_UNSUPPORTED_MESSAGE,
  DataExportFormat,
  DataExportTable,
  buildDataExportPageHref,
  exportAndDownloadDataTable,
  formatErrorMessage,
  isItemScope,
  noteDataExportError,
  tableNeedsProject,
} from '@/lib/importExport';

/** One exportable table in the menu, with a heading when there are several. */
export interface ExportMenuTable {
  table: DataExportTable;
  /** Group heading, e.g. "Fixture types" (shown when the menu has several tables). */
  label: string;
  /** Look / cue list / look board id for scoped tables. */
  scopeId?: string | null;
}

export interface ExportMenuButtonProps {
  /** Table to export. Use `tables` instead to offer several tables in one menu. */
  table?: DataExportTable;
  /** Several tables in one menu (e.g. Fixtures and Fixture types). */
  tables?: ReadonlyArray<ExportMenuTable>;
  /** Look / cue list / look board id for a scoped `table`. */
  scopeId?: string | null;
  /** Project to export from. Not needed for FIXTURE_LIBRARY. */
  projectId?: string | null;
  /**
   * `default` matches the light/dark page header buttons; `toolbar` matches
   * the always-dark editor toolbars (look editor, cue list player).
   */
  appearance?: 'default' | 'toolbar';
  /** Hide the "Export" text below the `sm` breakpoint (icon + chevron only). */
  compact?: boolean;
  /** Extra classes for the wrapper element. */
  className?: string;
}

const FORMAT_ITEMS: ReadonlyArray<{ format: DataExportFormat; label: string; icon: typeof DocumentTextIcon }> = [
  { format: DataExportFormat.Csv, label: 'CSV', icon: DocumentTextIcon },
  { format: DataExportFormat.Xlsx, label: 'Excel', icon: TableCellsIcon },
];

const ITEM_SELECTOR = '[role="menuitem"]:not([disabled])';

/** Space kept between the menu and the viewport edges, in px. */
const VIEWPORT_MARGIN = 8;
/** Gap between the button and the menu (Tailwind mt-1 / mb-1), in px. */
const MENU_GAP = 4;

/**
 * Where the open menu goes, relative to the button. `left` is the offset of
 * the menu's left edge from the button's left edge.
 */
interface MenuPlacement {
  left: number;
  up: boolean;
  maxHeight?: number;
}

/**
 * Right-align the menu with the button where it fits, but keep it inside the
 * viewport: shift it sideways near the screen edges (e.g. a button on the
 * left of a phone screen), open it upward when there is more room above, and
 * cap its height (it scrolls) when it fits neither way, e.g. a phone in
 * landscape. The cap is the space that actually exists on the roomier side,
 * however little that is (a short split-screen window or an open on-screen
 * keyboard), so no item ends up off-screen where it cannot be reached.
 * Returns null when the menu has not been laid out (no width).
 */
function computeMenuPlacement(trigger: DOMRect, menuWidth: number, menuHeight: number): MenuPlacement | null {
  if (menuWidth <= 0) return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = trigger.right - menuWidth;
  left = Math.min(left, vw - VIEWPORT_MARGIN - menuWidth);
  left = Math.max(left, VIEWPORT_MARGIN);
  const below = vh - trigger.bottom - MENU_GAP - VIEWPORT_MARGIN;
  const above = trigger.top - MENU_GAP - VIEWPORT_MARGIN;
  const up = menuHeight > below && above > below;
  const room = Math.max(up ? above : below, 0);
  return {
    left: left - trigger.left,
    up,
    maxHeight: menuHeight > room ? room : undefined,
  };
}

/** Stable key for a menu entry; the same table may appear with different scopes. */
function itemKey(item: ExportMenuTable): string {
  return `${item.table}:${item.scopeId ?? ''}`;
}

const BUTTON_CLASSES: Record<NonNullable<ExportMenuButtonProps['appearance']>, string> = {
  default:
    'inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] sm:min-h-0 [@media(any-pointer:coarse)]:min-h-[44px] border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation',
  toolbar:
    'inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] sm:min-h-0 [@media(any-pointer:coarse)]:min-h-[44px] text-sm font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation',
};

/**
 * Menu item padding: roomy (44px rows) on phones and whenever a touch screen
 * is present, compact with a mouse on wider screens. `any-pointer` rather
 * than `pointer`: on a touchscreen laptop the primary pointer is the
 * trackpad, but the user may still tap. Like the buttons' arbitrary
 * `[@media(any-pointer:coarse)]` variant, it is emitted after the `sm:`
 * rules, so it wins over `sm:min-h-0` / `sm:py-2`.
 */
const ITEM_CLASSES =
  'w-full text-left px-4 py-3 sm:py-2 [@media(any-pointer:coarse)]:py-3 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 transition-colors touch-manipulation';

/**
 * "Export ▾" button for list and detail pages. The menu offers CSV and
 * Excel downloads of the page's data (generated by the server) and a link
 * to the Import / Export page with the same context preselected.
 *
 * When the menu opens it loads `dataExportTables` (cached for the session)
 * and takes each table's rules from it: whether a project is needed (scope
 * `none` means no) and whether a scopeId is required (`scopeRequired`).
 * Until that list arrives, or if it cannot be loaded, only the legacy
 * project rule applies (the fixture library needs no project) and the
 * server enforces the rest.
 *
 * Older backends have no data export: when the server rejects
 * `dataExportTables` with "Cannot query field" the CSV / Excel items are
 * replaced by a note asking to update LacyLights.
 *
 * Keyboard: opening moves focus to the first item; Arrow Up/Down, Home and
 * End move between items; Escape closes and returns focus to the button;
 * Tab closes.
 */
export default function ExportMenuButton({
  table,
  tables,
  scopeId,
  projectId,
  appearance = 'default',
  compact = false,
  className = '',
}: ExportMenuButtonProps) {
  const client = useApolloClient();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placement, setPlacement] = useState<MenuPlacement | null>(null);
  const dataExportUnsupported = useDataExportUnsupported();

  const items: ReadonlyArray<ExportMenuTable> =
    tables && tables.length > 0 ? tables : table ? [{ table, label: '', scopeId }] : [];
  const showHeadings = items.length > 1;
  const primary = items[0];

  const close = useCallback(() => {
    setOpen(false);
    setError(null);
  }, []);

  // Close on Escape (anywhere) and give focus back to the button.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  const handleMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') {
      close();
      return;
    }
    const menuItems = Array.from(menuRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);
    if (menuItems.length === 0) return;
    const current = menuItems.indexOf(document.activeElement as HTMLElement);
    let next: number;
    switch (e.key) {
      case 'ArrowDown':
        next = current < 0 ? 0 : (current + 1) % menuItems.length;
        break;
      case 'ArrowUp':
        next = current < 0 ? menuItems.length - 1 : (current - 1 + menuItems.length) % menuItems.length;
        break;
      case 'Home':
        next = 0;
        break;
      case 'End':
        next = menuItems.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    menuItems[next].focus();
  };

  // On open, load the table rules and find out whether the backend has data
  // export at all. The list is cached by Apollo (and the "unsupported"
  // outcome per client), so this hits the network about once per session.
  // A failure other than "unknown field" (e.g. a transient network error)
  // leaves CSV / Excel visible with the fallback rules, and is retried the
  // next time the menu opens because Apollo does not cache errors.
  const { tables: tableInfos } = useDataExportTables({ skip: !open || dataExportUnsupported });
  const infoFor = (t: DataExportTable) => tableInfos?.find((info) => info.table === t) ?? null;
  const needsProject = (t: DataExportTable) => tableNeedsProject(t, infoFor(t));

  // Move focus into the menu when it opens, and again if the focused item
  // disappears or is disabled (e.g. CSV / Excel replaced by the "update
  // LacyLights" note, or disabled once the table rules arrive).
  useEffect(() => {
    if (!open) return;
    const menu = menuRef.current;
    const active = document.activeElement;
    const focusLost = !menu?.contains(active) || (active instanceof HTMLButtonElement && active.disabled);
    if (menu && focusLost) {
      menu.querySelector<HTMLElement>(ITEM_SELECTOR)?.focus();
    }
  }, [open, dataExportUnsupported, tableInfos]);

  // Keep the open menu inside the viewport (see computeMenuPlacement). Runs
  // before paint, again when its content changes size, and on resize /
  // rotation. The menu is absolutely positioned under the button, so it
  // follows the button when the page scrolls.
  useLayoutEffect(() => {
    if (!open) {
      setPlacement(null);
      return;
    }
    const update = () => {
      const trigger = triggerRef.current;
      const menu = menuRef.current;
      if (!trigger || !menu) return;
      setPlacement(computeMenuPlacement(trigger.getBoundingClientRect(), menu.offsetWidth, menu.scrollHeight));
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, [open, dataExportUnsupported, error, tableInfos]);

  /** Why the item cannot be exported here, or null when it can. */
  const blockedReason = (item: ExportMenuTable): string | null => {
    if (needsProject(item.table) && !projectId) return 'Open a project to export this list';
    const info = infoFor(item.table);
    if (info?.scopeRequired && !item.scopeId) {
      const what = isItemScope(info.scope) ? `a ${DATA_EXPORT_SCOPE_LABELS[info.scope].toLowerCase()}` : 'an item';
      return `Open ${what} to export this list`;
    }
    return null;
  };

  const handleExport = async (item: ExportMenuTable, format: DataExportFormat) => {
    const key = `${itemKey(item)}:${format}`;
    setBusyKey(key);
    setError(null);
    try {
      await exportAndDownloadDataTable(client, {
        table: item.table,
        format,
        projectId: needsProject(item.table) ? projectId : projectId || null,
        scopeId: item.scopeId ?? null,
      });
      setOpen(false);
      // The focused item unmounts with the menu; keep keyboard focus on the button.
      triggerRef.current?.focus();
    } catch (err) {
      // An older backend: the menu switches to the "update LacyLights" note.
      if (!noteDataExportError(client, err)) {
        setError(formatErrorMessage(err, 'Export failed.'));
      }
    } finally {
      setBusyKey(null);
    }
  };

  if (!primary) return null;

  // With several tables (e.g. Fixtures + Fixture types) the link preselects
  // the first one; the other tables are one click away in the panel.
  const moreHref = buildDataExportPageHref({
    table: primary.table,
    scopeId: primary.scopeId,
    projectId: needsProject(primary.table) ? projectId : null,
  });

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        className={BUTTON_CLASSES[appearance]}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label="Export"
        title="Export as CSV or Excel"
      >
        <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
        <span className={compact ? 'hidden sm:inline' : ''}>Export</span>
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <>
          {/* Backdrop: closes the menu on outside click / tap. It and the menu
              sit above the fixed mobile bottom navigation (z-50), so a tap on
              the navigation only closes the menu and the menu is never drawn
              underneath it (e.g. a phone in landscape). */}
          <div className="fixed inset-0 z-[55]" onClick={close} aria-hidden="true" data-testid="export-menu-backdrop" />
          <div
            id={menuId}
            ref={menuRef}
            role="menu"
            aria-label="Export options"
            onKeyDown={handleMenuKeyDown}
            style={
              placement
                ? { left: placement.left, right: 'auto', maxHeight: placement.maxHeight }
                : undefined
            }
            className={`absolute right-0 ${
              placement?.up ? 'bottom-full mb-1' : 'top-full mt-1'
            } z-[60] min-w-[220px] max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1`}
          >
            {dataExportUnsupported ? (
              <p className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300" role="note">
                {DATA_EXPORT_UNSUPPORTED_MESSAGE}
              </p>
            ) : (
              items.map((item, idx) => {
                const blocked = blockedReason(item);
                // Disabled items cannot take focus and a title is not shown on
                // touch or read reliably, so the reason is visible text that
                // the items reference with aria-describedby.
                const reasonId = blocked ? `${menuId}-reason-${idx}` : undefined;
                return (
                  <Fragment key={itemKey(item)}>
                    {showHeadings && (
                      <div
                        className={`px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 ${
                          idx > 0 ? 'border-t border-gray-200 dark:border-gray-700 mt-1' : ''
                        }`}
                        role="presentation"
                      >
                        {item.label}
                      </div>
                    )}
                    {FORMAT_ITEMS.map(({ format, label, icon: Icon }) => {
                      const key = `${itemKey(item)}:${format}`;
                      const disabled = busyKey !== null || blocked !== null;
                      return (
                        <button
                          key={key}
                          type="button"
                          role="menuitem"
                          disabled={disabled}
                          title={blocked ?? undefined}
                          aria-describedby={reasonId}
                          aria-label={showHeadings ? `${item.label} as ${label}` : label}
                          onClick={() => handleExport(item, format)}
                          className={`${ITEM_CLASSES} disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                          <span>{busyKey === key ? 'Exporting...' : label}</span>
                        </button>
                      );
                    })}
                    {blocked && (
                      <p id={reasonId} className="px-4 pb-2 text-xs text-gray-500 dark:text-gray-400">
                        {blocked}
                      </p>
                    )}
                  </Fragment>
                );
              })
            )}

            <div className="border-t border-gray-200 dark:border-gray-700 my-1" role="separator" />
            <Link
              href={moreHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className={ITEM_CLASSES}
            >
              <ArrowsUpDownIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>More import/export options…</span>
            </Link>

            {error && (
              <div
                role="alert"
                className="mx-2 my-1 p-2 rounded border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-xs text-red-700 dark:text-red-300"
              >
                {error}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
