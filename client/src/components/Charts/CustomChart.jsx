import React, { useState, useCallback, useRef } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  Brush,
  ReferenceLine,
  ReferenceArea,
  Label
} from 'recharts';
import { Download, ZoomIn, ZoomOut, Maximize2, Filter, Layers, Image as ImageIcon, FileText, Printer, RefreshCw, Eye, EyeOff, Settings } from 'lucide-react';

const COLORS = ['#1B4F8A', '#C9920A', '#2D7D3A', '#B5251A', '#6B7280', '#8B5E3C'];

// Advanced chart wrapper with export, zoom, and filtering capabilities
export const AdvancedChartWrapper = ({ children, title, onExport, showZoom = true, showFilter = true, showExport = true }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [exportFormat, setExportFormat] = useState('png');
  const chartRef = useRef(null);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleResetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const handleExport = useCallback(() => {
    if (!chartRef.current) return;
    
    const svgElement = chartRef.current.querySelector('svg');
    if (!svgElement) return;

    if (exportFormat === 'svg') {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chart-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'png') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `chart-${Date.now()}.png`;
        a.click();
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  }, [exportFormat]);

  return (
    <div className="space-y-4" ref={chartRef}>
      {/* Chart Header with Controls */}
      <div className="flex items-center justify-between">
        {title && <h3 className="font-semibold text-lg">{title}</h3>}
        <div className="flex items-center gap-2">
          {showZoom && (
            <>
              <button onClick={handleZoomOut} className="btn-secondary p-2" title="Zoom Out">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={handleZoomIn} className="btn-secondary p-2" title="Zoom In">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={handleResetZoom} className="btn-secondary p-2" title="Reset Zoom">
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}
          {showExport && (
            <div className="flex items-center gap-2">
              <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className="input text-sm py-1">
                <option value="png">PNG</option>
                <option value="svg">SVG</option>
              </select>
              <button onClick={handleExport} className="btn-secondary p-2" title="Export Chart">
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}
          <button onClick={() => setShowSettings(!showSettings)} className="btn-secondary p-2" title="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="card p-4 space-y-4">
          <h4 className="font-semibold">Chart Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Chart Theme</label>
              <select className="input">
                <option value="default">Default</option>
                <option value="dark">Dark</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Animation</label>
              <select className="input">
                <option value="smooth">Smooth</option>
                <option value="none">None</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Chart Content with Zoom */}
      <div style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left', transition: 'transform 0.3s ease' }}>
        {children}
      </div>
    </div>
  );
};

export const CustomLineChart = ({ data, lines, height = 300, showBrush = false, showReferenceLines = false, referenceLines = [], ...props }) => (
  <ResponsiveContainer width="100%" height={height}>
    <LineChart data={data} {...props}>
      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip content={<CustomTooltip />} />
      <Legend content={<CustomLegend />} />
      {showBrush && <Brush dataKey="name" height={30} stroke="#8884d8" />}
      {showReferenceLines && referenceLines.map((ref, i) => (
        <ReferenceLine
          key={i}
          x={ref.x}
          y={ref.y}
          stroke={ref.stroke || 'red'}
          strokeDasharray={ref.strokeDasharray || '3 3'}
          label={ref.label}
        />
      ))}
      {lines.map((line, index) => (
        <Line
          key={line.dataKey}
          type="monotone"
          dataKey={line.dataKey}
          stroke={line.color || COLORS[index % COLORS.length]}
          strokeWidth={line.strokeWidth || 2}
          name={line.name}
          dot={line.dot !== undefined ? line.dot : false}
          activeDot={{ r: 6 }}
          animationDuration={line.animationDuration || 1000}
        />
      ))}
    </LineChart>
  </ResponsiveContainer>
);

export const CustomBarChart = ({ data, bars, height = 300, showBrush = false, showReferenceLines = false, referenceLines = [], ...props }) => (
  <ResponsiveContainer width="100%" height={height}>
    <BarChart data={data} {...props}>
      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip content={<CustomTooltip />} />
      <Legend content={<CustomLegend />} />
      {showBrush && <Brush dataKey="name" height={30} stroke="#8884d8" />}
      {showReferenceLines && referenceLines.map((ref, i) => (
        <ReferenceLine
          key={i}
          x={ref.x}
          y={ref.y}
          stroke={ref.stroke || 'red'}
          strokeDasharray={ref.strokeDasharray || '3 3'}
          label={ref.label}
        />
      ))}
      {bars.map((bar, index) => (
        <Bar
          key={bar.dataKey}
          dataKey={bar.dataKey}
          fill={bar.color || COLORS[index % COLORS.length]}
          name={bar.name}
          radius={bar.radius || [4, 4, 0, 0]}
          animationDuration={bar.animationDuration || 1000}
        />
      ))}
    </BarChart>
  </ResponsiveContainer>
);

export const CustomAreaChart = ({ data, areas, height = 300, showBrush = false, showReferenceLines = false, referenceLines = [], ...props }) => (
  <ResponsiveContainer width="100%" height={height}>
    <AreaChart data={data} {...props}>
      <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip content={<CustomTooltip />} />
      <Legend content={<CustomLegend />} />
      {showBrush && <Brush dataKey="name" height={30} stroke="#8884d8" />}
      {showReferenceLines && referenceLines.map((ref, i) => (
        <ReferenceLine
          key={i}
          x={ref.x}
          y={ref.y}
          stroke={ref.stroke || 'red'}
          strokeDasharray={ref.strokeDasharray || '3 3'}
          label={ref.label}
        />
      ))}
      {areas.map((area, index) => (
        <Area
          key={area.dataKey}
          type="monotone"
          dataKey={area.dataKey}
          stroke={area.strokeColor || COLORS[index % COLORS.length]}
          fill={area.fillColor || COLORS[index % COLORS.length]}
          fillOpacity={area.fillOpacity || 0.6}
          strokeWidth={area.strokeWidth || 2}
          name={area.name}
          animationDuration={area.animationDuration || 1000}
        />
      ))}
    </AreaChart>
  </ResponsiveContainer>
);

export const CustomPieChart = ({ data, height = 300, showLabels = true, innerRadius = 0, outerRadius = 80, ...props }) => (
  <ResponsiveContainer width="100%" height={height}>
    <PieChart {...props}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={showLabels ? ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%` : false}
        outerRadius={outerRadius}
        innerRadius={innerRadius}
        fill="#8884d8"
        dataKey="value"
        animationDuration={1000}
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip content={<CustomTooltip />} />
      <Legend content={<CustomLegend />} />
    </PieChart>
  </ResponsiveContainer>
);

export const CustomTooltip = ({ active, payload, label, formatter, showDetails = false }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
        <p className="font-semibold text-sm mb-3 border-b pb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="mb-2">
            <div className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <p className="text-sm font-medium" style={{ color: entry.color }}>
                {entry.name}
              </p>
            </div>
            <p className="text-lg font-bold ml-5">
              {formatter ? formatter(entry.value, entry.name) : entry.value}
            </p>
            {showDetails && entry.payload && (
              <div className="ml-5 mt-1 text-xs text-gray-500">
                {Object.entries(entry.payload)
                  .filter(([key]) => key !== 'name' && key !== entry.dataKey)
                  .map(([key, val]) => (
                    <div key={key}>{key}: {val}</div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const CustomLegend = ({ payload, onToggle, hiddenSeries = new Set() }) => (
  <div className="flex flex-wrap gap-3 justify-center mt-4">
    {payload.map((entry, index) => {
      const isHidden = hiddenSeries.has(entry.value);
      return (
        <button
          key={index}
          onClick={() => onToggle && onToggle(entry.value)}
          className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full transition-all ${
            isHidden ? 'opacity-40 bg-gray-100' : 'bg-white border hover:bg-gray-50'
          }`}
        >
          <span 
            className="w-3 h-3 rounded" 
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
          {onToggle && (
            <span className="text-xs text-gray-400">
              {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

// Chart type switcher component
export const ChartTypeSwitcher = ({ chartType, onChartTypeChange, data, config }) => {
  const chartTypes = [
    { id: 'line', label: 'Line', icon: '📈' },
    { id: 'bar', label: 'Bar', icon: '📊' },
    { id: 'area', label: 'Area', icon: '📉' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">Chart Type:</span>
      <div className="flex gap-1">
        {chartTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => onChartTypeChange(type.id)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
              chartType === type.id
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type.icon} {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Universal chart component that can switch between types
export const UniversalChart = ({ data, config, chartType = 'line', onChartTypeChange, height = 300, ...props }) => {
  const { lines, bars, areas } = config;

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return <CustomLineChart data={data} lines={lines} height={height} {...props} />;
      case 'bar':
        return <CustomBarChart data={data} bars={bars} height={height} {...props} />;
      case 'area':
        return <CustomAreaChart data={data} areas={areas} height={height} {...props} />;
      default:
        return <CustomLineChart data={data} lines={lines} height={height} {...props} />;
    }
  };

  return (
    <div className="space-y-4">
      <ChartTypeSwitcher chartType={chartType} onChartTypeChange={onChartTypeChange} />
      {renderChart()}
    </div>
  );
};

// Chart comparison component
export const ChartComparison = ({ datasets, height = 400, ...props }) => {
  const [selectedDatasets, setSelectedDatasets] = useState(datasets.map((_, i) => i));
  const [comparisonMode, setComparisonMode] = useState('overlay'); // overlay, sideBySide

  const toggleDataset = (index) => {
    setSelectedDatasets(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const activeDatasets = datasets.filter((_, i) => selectedDatasets.includes(i));

  return (
    <div className="space-y-4">
      {/* Comparison Controls */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Datasets:</span>
          {datasets.map((dataset, index) => (
            <button
              key={index}
              onClick={() => toggleDataset(index)}
              className={`px-3 py-1 text-sm rounded-full transition-all ${
                selectedDatasets.includes(index)
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {dataset.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Mode:</span>
          <select
            value={comparisonMode}
            onChange={(e) => setComparisonMode(e.target.value)}
            className="input text-sm py-1"
          >
            <option value="overlay">Overlay</option>
            <option value="sideBySide">Side by Side</option>
          </select>
        </div>
      </div>

      {/* Chart Display */}
      {comparisonMode === 'overlay' ? (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={activeDatasets[0]?.data || []} {...props}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            {activeDatasets.map((dataset, index) => (
              <Line
                key={dataset.name}
                type="monotone"
                dataKey={dataset.dataKey}
                stroke={dataset.color || COLORS[index % COLORS.length]}
                strokeWidth={2}
                name={dataset.name}
                dot={false}
                animationDuration={1000}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeDatasets.map((dataset, index) => (
            <div key={dataset.name} className="card p-4">
              <h4 className="font-semibold mb-4" style={{ color: dataset.color || COLORS[index % COLORS.length] }}>
                {dataset.name}
              </h4>
              <ResponsiveContainer width="100%" height={height / 2}>
                <LineChart data={dataset.data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey={dataset.dataKey}
                    stroke={dataset.color || COLORS[index % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                    animationDuration={1000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Data filter component
export const ChartDataFilter = ({ data, onFilterChange, filterableColumns = [] }) => {
  const [filters, setFilters] = useState({});

  const handleFilterChange = (column, value) => {
    const newFilters = { ...filters, [column]: value };
    setFilters(newFilters);
    
    const filteredData = data.filter(item => {
      return Object.entries(newFilters).every(([key, filterValue]) => {
        if (!filterValue) return true;
        return item[key]?.toString().toLowerCase().includes(filterValue.toLowerCase());
      });
    });
    
    onFilterChange(filteredData);
  };

  return (
    <div className="card p-4 space-y-4">
      <h4 className="font-semibold flex items-center gap-2">
        <Filter className="w-4 h-4" />
        Data Filters
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filterableColumns.map(column => (
          <div key={column}>
            <label className="block text-sm font-medium mb-1 capitalize">{column}</label>
            <input
              type="text"
              placeholder={`Filter by ${column}...`}
              value={filters[column] || ''}
              onChange={(e) => handleFilterChange(column, e.target.value)}
              className="input"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
