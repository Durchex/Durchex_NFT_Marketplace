import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './AnalyticsDashboard.css';

/**
 * AnalyticsDashboard Component
 * Comprehensive analytics dashboard for NFT marketplace activity
 */
const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('7d'); // 7d, 30d, 90d, 1y, all

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  /**
   * Fetch analytics data from backend
   */
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/analytics?range=${timeRange}`);
      const data = await response.json();

      if (data.success) {
        setAnalytics(data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!analytics && loading) {
    return <div className="dashboard-loading">Loading analytics...</div>;
  }

  return (
    <div className="analytics-dashboard">
      {/* Header with Time Range */}
      <div className="dashboard-header">
        <h1>Marketplace Analytics</h1>
        <div className="time-range-selector">
          {['7d', '30d', '90d', '1y', 'all'].map(range => (
            <button
              key={range}
              className={`range-btn ${timeRange === range ? 'active' : ''}`}
              onClick={() => setTimeRange(range)}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      {analytics && (
        <>
          <div className="kpi-grid">
            <Card className="kpi-card">
              <CardHeader>
                <CardTitle>Total Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="kpi-value">{analytics.totalVolume?.toFixed(2)} ETH</div>
                <div className="kpi-change positive">↑ {analytics.volumeChange?.toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card className="kpi-card">
              <CardHeader>
                <CardTitle>Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="kpi-value">{analytics.totalSales?.toLocaleString()}</div>
                <div className="kpi-change positive">↑ {analytics.salesChange?.toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card className="kpi-card">
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="kpi-value">{analytics.activeUsers?.toLocaleString()}</div>
                <div className="kpi-change positive">↑ {analytics.userChange?.toFixed(1)}%</div>
              </CardContent>
            </Card>

            <Card className="kpi-card">
              <CardHeader>
                <CardTitle>Avg Sale Price</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="kpi-value">{analytics.avgPrice?.toFixed(3)} ETH</div>
                <div className="kpi-change negative">↓ {Math.abs(analytics.priceChange || 0).toFixed(1)}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for detailed analytics */}
          <Tabs defaultValue="overview" className="analytics-tabs">
            <TabsList className="tabs-list">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="trends">Trends</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="collections">Collections</TabsTrigger>
              <TabsTrigger value="kpis">KPIs</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="charts-grid">
                {/* Volume Chart */}
                <Card className="chart-card">
                  <CardHeader>
                    <CardTitle>Daily Volume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.volumeHistory || []}>
                        <defs>
                          <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="volume" stroke="#6366f1" fillOpacity={1} fill="url(#colorVolume)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Sales Count Chart */}
                <Card className="chart-card">
                  <CardHeader>
                    <CardTitle>Daily Sales Count</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.salesHistory || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Trends Tab */}
            <TabsContent value="trends">
              <Card className="chart-card full-width">
                <CardHeader>
                  <CardTitle>Price Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={analytics.priceHistory || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="avgPrice" stroke="#6366f1" strokeWidth={2} name="Average Price" />
                      <Line type="monotone" dataKey="minPrice" stroke="#ef4444" strokeWidth={2} name="Min Price" />
                      <Line type="monotone" dataKey="maxPrice" stroke="#10b981" strokeWidth={2} name="Max Price" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users">
              <div className="charts-grid">
                <Card className="chart-card">
                  <CardHeader>
                    <CardTitle>User Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analytics.userHistory || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="totalUsers" stroke="#6366f1" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="chart-card">
                  <CardHeader>
                    <CardTitle>User Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Buyers', value: analytics.buyerCount || 0 },
                            { name: 'Sellers', value: analytics.sellerCount || 0 },
                            { name: 'Both', value: analytics.bothCount || 0 },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#6366f1" />
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Collections Tab */}
            <TabsContent value="collections">
              <Card className="chart-card full-width">
                <CardHeader>
                  <CardTitle>Top Collections by Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analytics.topCollections || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="volume" fill="#6366f1" name="Volume (ETH)" />
                      <Bar dataKey="sales" fill="#10b981" name="Sales Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* KPIs Tab */}
            <TabsContent value="kpis">
              <div className="kpi-detailed-grid">
                <Card className="kpi-detail-card">
                  <CardHeader>
                    <CardTitle>Marketplace Health</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="kpi-metric">
                      <span>Liquidity Score</span>
                      <span className="kpi-metric-value">{analytics.liquidityScore?.toFixed(1)}/100</span>
                    </div>
                    <div className="kpi-metric">
                      <span>Activity Level</span>
                      <span className="kpi-metric-value">{analytics.activityLevel?.toFixed(1)}/100</span>
                    </div>
                    <div className="kpi-metric">
                      <span>User Retention</span>
                      <span className="kpi-metric-value">{analytics.retention?.toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="kpi-detail-card">
                  <CardHeader>
                    <CardTitle>Market Dynamics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="kpi-metric">
                      <span>Floor Price (Avg)</span>
                      <span className="kpi-metric-value">{analytics.floorPrice?.toFixed(3)} ETH</span>
                    </div>
                    <div className="kpi-metric">
                      <span>Ceiling Price (Avg)</span>
                      <span className="kpi-metric-value">{analytics.ceilingPrice?.toFixed(3)} ETH</span>
                    </div>
                    <div className="kpi-metric">
                      <span>Price Volatility</span>
                      <span className="kpi-metric-value">{analytics.volatility?.toFixed(1)}%</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
