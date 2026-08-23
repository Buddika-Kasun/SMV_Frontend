import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface ColumnConfig {
  id: string;
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
}

export function useResizableColumns(
  initialColumns: ColumnConfig[],
  storageKey?: string
) {
  // Load initial column widths from localStorage if available
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`smv_col_widths_${storageKey}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          const initialMap: Record<string, number> = {};
          initialColumns.forEach(col => {
            initialMap[col.id] = typeof parsed[col.id] === 'number' ? parsed[col.id] : col.defaultWidth;
          });
          return initialMap;
        }
      } catch (e) {
        console.warn('Failed to load saved column widths', e);
      }
    }
    const defaults: Record<string, number> = {};
    initialColumns.forEach(col => {
      defaults[col.id] = col.defaultWidth;
    });
    return defaults;
  });

  const [resizingColId, setResizingColId] = useState<string | null>(null);

  const resizeStateRef = useRef<{
    colId: string;
    startX: number;
    startWidth: number;
    minWidth: number;
    maxWidth: number;
  } | null>(null);

  const startResize = useCallback((colId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const colConfig = initialColumns.find(c => c.id === colId);
    const minWidth = colConfig?.minWidth || 60;
    const maxWidth = colConfig?.maxWidth || 1200;
    const currentWidth = columnWidths[colId] || colConfig?.defaultWidth || 120;

    resizeStateRef.current = {
      colId,
      startX: e.clientX,
      startWidth: currentWidth,
      minWidth,
      maxWidth,
    };

    setResizingColId(colId);

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!resizeStateRef.current) return;
      const deltaX = moveEvent.clientX - resizeStateRef.current.startX;
      const newWidth = Math.max(
        resizeStateRef.current.minWidth,
        Math.min(resizeStateRef.current.maxWidth, resizeStateRef.current.startWidth + deltaX)
      );

      setColumnWidths(prev => {
        const updated = {
          ...prev,
          [resizeStateRef.current!.colId]: Math.round(newWidth),
        };
        if (storageKey && typeof window !== 'undefined') {
          try {
            localStorage.setItem(`smv_col_widths_${storageKey}`, JSON.stringify(updated));
          } catch {}
        }
        return updated;
      });
    };

    const onMouseUp = () => {
      setResizingColId(null);
      resizeStateRef.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [initialColumns, columnWidths, storageKey]);

  const resetToDefault = useCallback(() => {
    const defaults: Record<string, number> = {};
    initialColumns.forEach(col => {
      defaults[col.id] = col.defaultWidth;
    });
    setColumnWidths(defaults);
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`smv_col_widths_${storageKey}`);
      } catch {}
    }
  }, [initialColumns, storageKey]);

  const handleDoubleClickReset = useCallback((colId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const colConfig = initialColumns.find(c => c.id === colId);
    if (!colConfig) return;

    setColumnWidths(prev => {
      const updated = {
        ...prev,
        [colId]: colConfig.defaultWidth,
      };
      if (storageKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`smv_col_widths_${storageKey}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  }, [initialColumns, storageKey]);

  const totalTableWidth = Object.values(columnWidths).reduce((sum: number, w: number) => sum + w, 0);

  return {
    columnWidths,
    startResize,
    resetToDefault,
    handleDoubleClickReset,
    resizingColId,
    isResizing: resizingColId !== null,
    totalTableWidth,
  };
}
