import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartData {
  date: string;
  close: number;
  originalDate: string;
}

interface StockDataPoint {
  date: string;
  close: string | number;
}

type TimeFrame = 'hourly' | 'daily' | 'weekly' | 'monthly';

const TSLAStockChart = () => {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTimeFrame, setActiveTimeFrame] = useState<TimeFrame>('daily');

  const timeFrames = [
    { key: 'hourly' as TimeFrame, label: 'Hourly' },
    { key: 'daily' as TimeFrame, label: 'Daily' },
    { key: 'weekly' as TimeFrame, label: 'Weekly' },
    { key: 'monthly' as TimeFrame, label: 'Monthly' }
  ];

const fetchData = async (timeFrame: TimeFrame): Promise<void> => {
  setLoading(true);
  setError(null);

  try {
    const response = await fetch(
      `https://chart.stockscan.io/candle/v3/TSLA/${timeFrame}/NASDAQ`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    // Lấy mảng candles
    const candles: StockDataPoint[] = result.candles || [];

    // Transform data cho chart
    const chartData: ChartData[] = candles.map((item) => ({
      date: new Date(item.date).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        ...(timeFrame === "hourly" && { hour: "2-digit", minute: "2-digit" }),
      }),
      close: typeof item.close === "string" ? parseFloat(item.close) : item.close,
      originalDate: item.date,
    }));

    const sortedData: ChartData[] = chartData
      .sort(
        (a, b) =>
          new Date(a.originalDate).getTime() -
          new Date(b.originalDate).getTime()
      )
      .slice(-50);

    setData(sortedData);
  } catch (err: any) {
    setError(`Failed to fetch data: ${err.message}`);
    console.error("Error fetching data:", err);
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchData(activeTimeFrame);
  }, [activeTimeFrame]);

  const handleTimeFrameChange = (timeFrame: TimeFrame): void => {
    setActiveTimeFrame(timeFrame);
  };

  const formatTooltip = (value: any, name: string): [string, string] => {
    if (name === 'close') {
      return [`$${value.toFixed(2)}`, 'Close Price'];
    }
    return [value, name];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">TSLA Stock Chart</h1>
            <p className="text-gray-600">Tesla Inc. (NASDAQ: TSLA) Stock Price Analysis</p>
          </div>

          {/* Time Frame Buttons */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {timeFrames.map((timeFrame) => (
                <button
                  key={timeFrame.key}
                  onClick={() => handleTimeFrameChange(timeFrame.key)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTimeFrame === timeFrame.key
                      ? 'bg-blue-600 text-white shadow-md transform scale-105'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 hover:shadow-sm'
                  }`}
                  disabled={loading}
                >
                  {timeFrame.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Container */}
          <div className="bg-white border rounded-lg p-4">
            {loading && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading chart data...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="text-red-500 text-xl mb-2">⚠️</div>
                  <p className="text-red-600 font-medium">{error}</p>
                  <button
                    onClick={() => fetchData(activeTimeFrame)}
                    className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && data.length > 0 && (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Price Trend - {timeFrames.find(tf => tf.key === activeTimeFrame)?.label} View
                  </h3>
                  <p className="text-sm text-gray-600">
                    Showing last {data.length} data points
                  </p>
                </div>
                
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={data}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      stroke="#666"
                      fontSize={12}
                      tickFormatter={(value: number) => `$${value.toFixed(0)}`}
                      domain={['dataMin - 5', 'dataMax + 5']}
                    />
                    <Tooltip 
                      formatter={formatTooltip}
                      labelStyle={{ color: '#374151' }}
                      contentStyle={{
                        backgroundColor: '#f9fafb',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="close" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
                      activeDot={{ r: 5, fill: '#1d4ed8' }}
                      name="Close Price"
                    />
                  </LineChart>
                </ResponsiveContainer>

                {/* Summary Stats */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {data.length > 0 && (
                    <>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-blue-600 uppercase font-medium">Current Price</p>
                        <p className="text-lg font-bold text-blue-800">
                          ${data[data.length - 1]?.close.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-xs text-green-600 uppercase font-medium">Highest</p>
                        <p className="text-lg font-bold text-green-800">
                          ${Math.max(...data.map((d: ChartData) => d.close)).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <p className="text-xs text-red-600 uppercase font-medium">Lowest</p>
                        <p className="text-lg font-bold text-red-800">
                          ${Math.min(...data.map((d: ChartData) => d.close)).toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-600 uppercase font-medium">Average</p>
                        <p className="text-lg font-bold text-gray-800">
                          ${(data.reduce((sum: number, d: ChartData) => sum + d.close, 0) / data.length).toFixed(2)}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {!loading && !error && data.length === 0 && (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="text-gray-400 text-xl mb-2">📈</div>
                  <p className="text-gray-600">No data available for the selected timeframe</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TSLAStockChart;