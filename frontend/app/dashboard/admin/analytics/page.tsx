'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import {
  getAdminAnalytics,
  getInstitutions,
  exportAdminAnalytics,
  compareInstitutions,
  getAtRiskStudents,
  getAnalyticsMetadata
} from '@/lib/api';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  Users, BookOpen, Trophy, School, Activity,
  Download, Filter, Search, AlertTriangle,
  ArrowRightLeft, Calendar, FileText, Info
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Data States
  const [data, setData] = useState<any>(null);
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [atRiskData, setAtRiskData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  // Filter States
  const [filters, setFilters] = useState({
    institutionType: '',
    university: '',
    college: '',
    department: '',
    startDate: '',
    endDate: ''
  });

  // Comparison State
  const [compareFilters, setCompareFilters] = useState({ type: '', id1: '', id2: '' });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') loadAnalytics();
    if (activeTab === 'at-risk') loadAtRisk();
  }, [activeTab, filters]);

  const loadInitialData = async () => {
    try {
      const [displayInst, meta] = await Promise.all([
        getInstitutions(),
        getAnalyticsMetadata()
      ]);
      setInstitutions(displayInst);
      setDepartments(meta.departments || []);
      await loadAnalytics();
    } catch (error) {
      console.error("Failed to load initial data", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const analyticsData = await getAdminAnalytics(filters);
      setData(analyticsData);
    } catch (error) {
      console.error("Failed to load analytics", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAtRisk = async () => {
    setLoading(true);
    try {
      const riskData = await getAtRiskStudents(filters);
      setAtRiskData(riskData);
    } catch (error) {
      console.error("Failed to load at-risk data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!compareFilters.id1 || !compareFilters.id2) return;
    setLoading(true);
    try {
      const compData = await compareInstitutions(compareFilters.id1, compareFilters.id2);
      setComparisonData(compData);
    } catch (error) {
      console.error("Failed to load comparison", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const exportData = await exportAdminAnalytics(filters);

      // Convert JSON to CSV
      if (!exportData || exportData.length === 0) {
        alert("No data to export");
        return;
      }

      const headers = Object.keys(exportData[0]).join(',');
      const csv = [
        headers,
        ...exportData.map((row: any) => Object.values(row).map(v => `"${v}"`).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export", error);
    }
  };

  // Filter Variables
  const filteredInstitutions = filters.institutionType
    ? institutions.filter(i => i.type === filters.institutionType)
    : institutions;

  const universities = institutions.filter(i => i.type === 'university');
  const colleges = filters.university
    ? institutions.find(i => i.id === filters.university || i._id === filters.university)?.colleges || []
    : [];

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 pt-24 pb-8">

          {/* Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-3 bg-indigo-100 rounded-xl">
                    <Activity className="w-8 h-8 text-indigo-600" />
                  </div>
                  Advanced Analytics
                </h1>
                <p className="text-gray-500 mt-2 ml-16">
                  Deep dive into platform usage, engagement, and demographics.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleExport}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Export Excel/CSV
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Institution Type</label>
                <select
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  value={filters.institutionType}
                  onChange={(e) => setFilters({ ...filters, institutionType: e.target.value, university: '', college: '', department: '' })}
                >
                  <option value="">All Types</option>
                  <option value="university">University</option>
                  <option value="college">College</option>
                  <option value="school">School</option>
                  <option value="ngo">NGO</option>
                </select>
              </div>

              {/* Institution Filter - Hidden for NGO, School, and independent Colleges */}
              {filters.institutionType !== 'ngo' && filters.institutionType !== 'college' && filters.institutionType !== 'school' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Institution</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    value={filters.university}
                    onChange={(e) => setFilters({ ...filters, university: e.target.value, college: '' })}
                  >
                    <option value="">All Institutions</option>
                    {filteredInstitutions.map((inst: any) => (
                      <option key={inst.id || inst._id} value={inst.id || inst._id}>{inst.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sub-College Filter - Only for Universities */}
              {filters.university && colleges.length > 0 && filters.institutionType === 'university' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Sub-College</label>
                  <select
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    value={filters.college}
                    onChange={(e) => setFilters({ ...filters, college: e.target.value })}
                  >
                    <option value="">All Sub-Colleges</option>
                    {colleges.map((col: string, idx: number) => (
                      <option key={idx} value={col}>{col}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Department/Class Filter - Hidden for NGO */}
              {filters.institutionType !== 'ngo' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    {filters.institutionType === 'school' ? 'Class' : 'Department'}
                  </label>
                  <select
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                  >
                    <option value="">
                      {filters.institutionType === 'school' ? 'All Classes' : 'All Departments'}
                    </option>

                    {filters.institutionType === 'school' ? (
                      // School: Class 1-12
                      Array.from({ length: 12 }, (_, i) => i + 1).map((cls) => (
                        <option key={cls} value={cls}>Class {cls}</option>
                      ))
                    ) : (
                      // Uni/College: Departments
                      departments.map((dept: string, idx: number) => (
                        <option key={idx} value={dept}>{dept}</option>
                      ))
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-8 border-b border-gray-100">
              {['overview', 'comparison', 'at-risk'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && data && <OverviewTab data={data} />}

              {activeTab === 'comparison' && (
                <ComparisonTab
                  institutions={institutions}
                  filters={compareFilters}
                  setFilters={setCompareFilters}
                  onCompare={handleCompare}
                  data={comparisonData}
                />
              )}

              {activeTab === 'at-risk' && atRiskData && <AtRiskTab data={atRiskData} />}
            </>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}

function OverviewTab({ data }: { data: any }) {
  const roleData = data.roleDistribution || [];
  const monthlyData = data.monthlyActivity || [];
  const deptData = (data.academicDemographics?.departmentDistribution || []).map((d: any) => ({
    name: d._id || 'Unknown',
    value: d.count
  }));
  const semesterData = (data.academicDemographics?.semesterDistribution || []).map((d: any) => ({
    name: `Sem ${d._id}`,
    value: d.count
  }));

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Total Users" value={data.totalUsers} icon={<Users className="w-6 h-6 text-blue-600" />} bg="bg-blue-50" />
        <MetricCard title="Institutions" value={data.totalInstitutions} icon={<School className="w-6 h-6 text-green-600" />} bg="bg-green-50" />
        <MetricCard title="Lessons" value={data.totalLessons} icon={<BookOpen className="w-6 h-6 text-purple-600" />} bg="bg-purple-50" />
        <MetricCard title="Quizzes" value={data.totalQuizzes} icon={<Trophy className="w-6 h-6 text-orange-600" />} bg="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard title="User Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={roleData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" paddingAngle={5} dataKey="value" label>
                {roleData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Activity">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="lessons" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="quizzes" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {semesterData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="Students by Semester">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={semesterData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={60} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {deptData.length > 0 && (
            <ChartCard title="Top Departments">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} margin={{ bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} dy={10} angle={-15} textAnchor="end" height={60} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </div>
      )}
    </div>
  );
}

function ComparisonTab({ institutions, filters, setFilters, onCompare, data }: any) {
  const filteredInstitutions = filters.type
    ? institutions.filter((i: any) => i.type === filters.type)
    : institutions;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-gray-500" />
          Compare Institutions
        </h3>

        {/* Comparison Filters */}
        <div className="mb-4">
          <label className="block text-sm text-gray-500 mb-1">Filter by Type</label>
          <select
            className="w-full md:w-1/3 px-3 py-2 border rounded-lg"
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value, id1: '', id2: '' })}
          >
            <option value="">All Types</option>
            <option value="university">University</option>
            <option value="college">College</option>
            <option value="school">School</option>
            <option value="ngo">NGO</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm text-gray-500 mb-1">Institution A</label>
            <select
              className="w-full px-3 py-2 border rounded-lg"
              value={filters.id1}
              onChange={(e) => setFilters({ ...filters, id1: e.target.value })}
            >
              <option value="">Select Institution</option>
              {filteredInstitutions.map((i: any) => <option key={i.id || i._id} value={i.id || i._id}>{i.name}</option>)}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm text-gray-500 mb-1">Institution B</label>
            <select
              className="w-full px-3 py-2 border rounded-lg"
              value={filters.id2}
              onChange={(e) => setFilters({ ...filters, id2: e.target.value })}
            >
              <option value="">Select Institution</option>
              {filteredInstitutions.map((i: any) => <option key={i.id || i._id} value={i.id || i._id}>{i.name}</option>)}
            </select>
          </div>
          <button
            onClick={onCompare}
            disabled={!filters.id1 || !filters.id2}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            Compare
          </button>
        </div>
      </div>

      {data.length === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-xl mb-4 text-center">Engagement Score</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="id" tickFormatter={(id) => institutions.find((i: any) => (i.id || i._id) === id)?.name || id} />
                <YAxis />
                <Tooltip labelFormatter={(id) => institutions.find((i: any) => (i.id || i._id) === id)?.name || id} />
                <Bar dataKey="engagement" fill="#8884d8" name="Engagement Score" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-xl mb-4 text-center">User Composition</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="id" tickFormatter={(id) => institutions.find((i: any) => (i.id || i._id) === id)?.name || id} />
                <YAxis />
                <Tooltip labelFormatter={(id) => institutions.find((i: any) => (i.id || i._id) === id)?.name || id} />
                <Legend />
                <Bar dataKey="students" fill="#10b981" name="Students" stackId="users" />
                <Bar dataKey="teachers" fill="#3b82f6" name="Teachers" stackId="users" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// Removed EngagementTab and related logic as per user request

function AtRiskTab({ data }: { data: any[] }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            At-Risk Students
          </h3>
          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
            {data.length} Identified
          </span>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg text-sm text-amber-800 flex items-start gap-2">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Risk Criteria:</strong> Students are flagged as at-risk if they meet any of the following conditions:
            <ul className="list-disc ml-5 mt-1 space-y-1">
              <li>Average internal assessment score is below 40%.</li>
              <li>Inactivity for more than 30 days (requires login tracking).</li>
              <li>Consistently missing assignment deadlines.</li>
            </ul>
            <p className="mt-2 text-xs">Currently tracking: <em>Low Assessment Scores</em></p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Student Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Issue Factor</th>
              <th className="px-6 py-4">Performance</th>
              <th className="px-6 py-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((student, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                <td className="px-6 py-4 text-gray-500">{student.email}</td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {student.issue}
                  </span>
                </td>
                <td className="px-6 py-4 text-red-600 font-bold">{student.score}</td>
                <td className="px-6 py-4">
                  <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No at-risk students found matching current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, bg }: { title: string, value: string | number, icon: React.ReactNode, bg: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center transition-transform hover:scale-[1.02]">
      <div className={`p-4 rounded-xl ${bg} mr-4`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <h4 className="text-2xl font-bold text-gray-900 mt-1">{value}</h4>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[400px] flex flex-col">
      <h3 className="text-lg font-bold mb-6 text-gray-800 flex items-center gap-2">
        <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
        {title}
      </h3>
      <div className="flex-1 w-full min-h-0">
        {children}
      </div>
    </div>
  );
}