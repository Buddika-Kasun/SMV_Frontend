import React from 'react';
import { RotateCcw, Columns3, ArrowLeftRight } from 'lucide-react';

interface ResizableThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  columnId: string;
  width?: number;
  onResizeStart?: (columnId: string, e: React.MouseEvent) => void;
  onDoubleClickReset?: (columnId: string, e: React.MouseEvent) => void;
  isResizing?: boolean;
  isResizingActive?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
  enableResize?: boolean;
  children: React.ReactNode;
}

export const ResizableTh: React.FC<ResizableThProps> = ({
  columnId,
  width,
  onResizeStart,
  onDoubleClickReset,
  isResizing = false,
  isResizingActive = false,
  align = 'left',
  className = '',
  enableResize = true,
  children,
  ...rest
}) => {
  const alignClass = 
    align === 'right' ? 'text-right justify-end' :
    align === 'center' ? 'text-center justify-center' :
    'text-left justify-start';

  return (
    <th
      style={{
        width: width ? `${width}px` : undefined,
        minWidth: width ? `${width}px` : undefined,
        maxWidth: width ? `${width}px` : undefined,
      }}
      className={`relative select-none p-3.5 font-semibold text-slate-700 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 text-xs tracking-tight transition-colors ${
        isResizingActive ? 'bg-blue-100/80 text-blue-900 ring-1 ring-blue-400/40' : ''
      } ${className}`}
      {...rest}
    >
      <div className={`flex items-center gap-1.5 overflow-hidden ${alignClass}`}>
        <span className="truncate block font-semibold">{children}</span>
      </div>

      {/* Excel Drag Resizer Handle */}
      {enableResize && onResizeStart && (
        <div
          onMouseDown={(e) => onResizeStart(columnId, e)}
          onDoubleClick={(e) => onDoubleClickReset?.(columnId, e)}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center z-20 group hover:bg-blue-500/20 active:bg-blue-600/30 select-none"
          title="Drag to resize column (Double-click to reset width)"
        >
          {/* Subtle vertical divider line like Excel */}
          <div
            className={`w-[2px] h-4 rounded-full transition-all duration-150 ${
              isResizingActive
                ? 'bg-blue-600 h-full w-[2px] shadow-sm'
                : 'bg-slate-300 group-hover:bg-blue-600 group-hover:h-full'
            }`}
          />
        </div>
      )}
    </th>
  );
};

interface ResizableTableContainerProps {
  children: React.ReactNode;
  maxHeight?: string; // e.g. 'max-h-[580px]' or 'max-h-[650px]'
  minWidth?: number | string;
  totalTableWidth?: number;
  onResetColumns?: () => void;
  title?: string;
  itemCount?: number;
  className?: string;
  showScrollHint?: boolean;
}

export const ResizableTableContainer: React.FC<ResizableTableContainerProps> = ({
  children,
  maxHeight = 'max-h-[580px]',
  minWidth,
  totalTableWidth,
  onResetColumns,
  title,
  itemCount,
  className = '',
  showScrollHint = true,
}) => {
  return (
    <div className={`bg-white border border-slate-200/90 rounded-xl shadow-2xs overflow-hidden flex flex-col ${className}`}>
      
      {/* Sub-header Controls / Excel Indicator Bar */}
      {(onResetColumns || title || typeof itemCount === 'number' || showScrollHint) && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50/90 border-b border-slate-200/80 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            {title && (
              <span className="font-bold text-slate-800 text-xs">{title}</span>
            )}
            {typeof itemCount === 'number' && (
              <span className="bg-slate-200/70 text-slate-700 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                {itemCount} {itemCount === 1 ? 'record' : 'records'}
              </span>
            )}
            {showScrollHint && (
              <div className="hidden sm:flex items-center gap-1.5 text-slate-400 text-[10px] pl-2 border-l border-slate-200">
                <ArrowLeftRight className="w-3 h-3 text-slate-400" />
                <span>Scroll vertically & horizontally • Drag column headers to resize</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onResetColumns && (
              <button
                type="button"
                onClick={onResetColumns}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-blue-700 hover:bg-white px-2 py-1 rounded-md border border-slate-200/60 shadow-2xs transition"
                title="Reset all column widths to default Excel view"
              >
                <RotateCcw className="w-3 h-3 text-slate-400" />
                <span>Reset Column Widths</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Scrollable Table View: Vertical + Horizontal Scroll with Sticky Header */}
      <div 
        className={`w-full overflow-x-auto overflow-y-auto ${maxHeight} scrollbar-thin scrollbar-thumb-slate-300 hover:scrollbar-thumb-slate-400 scrollbar-track-slate-50 relative`}
      >
        <div style={{ minWidth: totalTableWidth ? `${totalTableWidth}px` : (minWidth || '100%') }}>
          {children}
        </div>
      </div>

    </div>
  );
};
