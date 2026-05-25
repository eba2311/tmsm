import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, Search, Filter, Download, MoreHorizontal, Eye, EyeOff, Printer, Check, X, Columns, RefreshCw, Loader2, AlertCircle } from 'lucide-react';

export const DataTable = ({
  data = [],
  columns = [],
  searchable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  onRowClick,
  actions = [],
  className = '',
  selectable = false,
  onSelectionChange,
  loading = false,
  error = null,
  stickyHeader = false,
  exportable = false,
  onExport,
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  
  // New state for advanced features
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(() => 
    columns.reduce((acc, col) => ({ ...acc, [col.accessor]: true }), {})
  );
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [exportFormat, setExportFormat] = useState('csv');
  const [printMode, setPrintMode] = useState(false);
  const [columnWidths, setColumnWidths] = useState({});
  const [resizingColumn, setResizingColumn] = useState(null);
  const tableRef = useRef(null);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return columns.some(column => {
        const value = item[column.accessor];
        return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, pageSize, pagination]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (column) => {
    if (!sortable || !column.sortable) return null;

    const isActive = sortConfig.key === column.accessor;
    const direction = sortConfig.direction;

    return (
      <span className="ml-2 inline-flex flex-col">
        <ChevronUp
          className={`w-3 h-3 ${isActive && direction === 'asc' ? 'text-primary' : 'text-gray-400'}`}
        />
        <ChevronDown
          className={`w-3 h-3 -mt-1 ${isActive && direction === 'desc' ? 'text-primary' : 'text-gray-400'}`}
        />
      </span>
    );
  };

  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {/* Search and Filter Bar */}
      {searchable && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9"
            />
          </div>
          {actions.length > 0 && (
            <div className="flex items-center gap-2">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="btn-secondary flex items-center gap-2 text-sm"
                  disabled={action.disabled}
                >
                  {action.icon && <action.icon className="w-4 h-4" />}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.accessor}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    sortable && column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => sortable && column.sortable && handleSort(column.accessor)}
                >
                  <div className="flex items-center">
                    {column.header}
                    {renderSortIcon(column)}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column) => (
                  <td key={column.accessor} className="px-4 py-3 text-sm text-gray-900">
                    {column.cell ? column.cell(row[column.accessor], row) : row[column.accessor]}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      {actions.map((action, actionIndex) => (
                        <button
                          key={actionIndex}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(row);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                          title={action.title}
                        >
                          {action.icon && <action.icon className="w-4 h-4" />}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of{' '}
            {sortedData.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="btn-secondary !py-1 !px-3 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="btn-secondary !py-1 !px-3 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-2">
            <Search className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No data found</h3>
          <p className="text-gray-500">
            {searchTerm ? 'Try adjusting your search terms' : 'No data available'}
          </p>
        </div>
      )}
    </div>
  );
};

export const StatusBadge = ({ status, type = 'default' }) => {
  const statusStyles = {
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    default: 'bg-gray-100 text-gray-800'
  };

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[type] || statusStyles.default}`}>
      {status}
    </span>
  );
};
