import React, { useState, useEffect } from 'react';
import { useRole } from '../../../context/RoleContext';
import { analyticsApi } from '../../../api/analyticsApi';
import { StatCard } from '../../../components/admin/widgets/StatCard';
import { Activity, Users, Building, Briefcase, Award, TrendingUp, DollarSign } from 'lucide-react';

const SuperAdminBI = ({ data, loading }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total Active Users" value={data?.totalActiveUsers} icon={Users} isLoading={loading} />
      <StatCard title="Platform Growth" value={data?.platformGrowth} icon={TrendingUp} isLoading={loading} />
      <StatCard title="Total Colleges" value={data?.colleges} icon={Building} isLoading={loading} />
      <StatCard title="Total Companies" value={data?.companies} icon={Briefcase} isLoading={loading} />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Students" value={data?.students} icon={Users} isLoading={loading} />
      <StatCard title="Active Jobs" value={data?.jobs} icon={Briefcase} isLoading={loading} />
      <StatCard title="Applications" value={data?.applications} icon={Activity} isLoading={loading} />
      <StatCard title="Total Placements" value={data?.placements} icon={Award} isLoading={loading} />
    </div>
  </div>
);

const CollegeBI = ({ data, loading }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Total Students" value={data?.students} icon={Users} isLoading={loading} />
      <StatCard title="Placement Rate" value={`${data?.placementRate}%`} icon={TrendingUp} isLoading={loading} />
      <StatCard title="Highest Package" value={`$${data?.highestPackage?.toLocaleString()}`} icon={DollarSign} isLoading={loading} />
      <StatCard title="Average Package" value={`$${Math.round(data?.avgPackage || 0).toLocaleString()}`} icon={DollarSign} isLoading={loading} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Pipeline Stats</h3>
        <ul className="space-y-4">
          <li className="flex justify-between items-center"><span className="text-gray-500">Placement Drives</span><span className="font-bold">{data?.drives}</span></li>
          <li className="flex justify-between items-center"><span className="text-gray-500">Applications Submitted</span><span className="font-bold">{data?.applications}</span></li>
          <li className="flex justify-between items-center"><span className="text-gray-500">Students Placed</span><span className="font-bold">{data?.totalPlaced}</span></li>
        </ul>
      </div>
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
         {/* Placeholder for future Chart.js / Recharts integration */}
         <p className="text-gray-500 text-sm italic">Department-wise Salary Trends Chart</p>
      </div>
    </div>
  </div>
);

const CompanyBI = ({ data, loading }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Active Jobs" value={data?.activeJobs} icon={Briefcase} isLoading={loading} />
      <StatCard title="Applications" value={data?.totalApplications} icon={Users} isLoading={loading} />
      <StatCard title="Interview Rate" value={`${data?.interviewRate}%`} icon={TrendingUp} isLoading={loading} />
      <StatCard title="Offer Rate" value={`${data?.offerRate}%`} icon={Award} isLoading={loading} />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Hiring Funnel</h3>
        <ul className="space-y-4">
          <li className="flex justify-between items-center"><span className="text-gray-500">Total Applications</span><span className="font-bold text-gray-900 dark:text-white">{data?.totalApplications}</span></li>
          <li className="flex justify-between items-center"><span className="text-gray-500">Interviews Conducted</span><span className="font-bold text-indigo-600">{data?.totalInterviews}</span></li>
          <li className="flex justify-between items-center"><span className="text-gray-500">Offers Released</span><span className="font-bold text-green-600">{data?.totalOffers}</span></li>
        </ul>
      </div>
      <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center">
         <p className="text-gray-500 text-sm italic">Time-to-Hire Analytics Chart</p>
      </div>
    </div>
  </div>
);


const AnalyticsCommandCenter = () => {
  const { isSuperAdmin, isCollegeAdmin, isTpo, isCompanyAdmin, isRecruiter } = useRole();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let res;
        if (isSuperAdmin) {
          res = await analyticsApi.getSuperAdminAnalytics();
        } else if (isCollegeAdmin || isTpo) {
          res = await analyticsApi.getCollegeAnalytics();
        } else if (isCompanyAdmin || isRecruiter) {
          res = await analyticsApi.getCompanyAnalytics();
        }
        setData(res?.data?.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isSuperAdmin, isCollegeAdmin, isTpo, isCompanyAdmin, isRecruiter]);

  let dashboardView = <div className="text-gray-500">You do not have access to Analytics.</div>;

  if (isSuperAdmin) {
    dashboardView = <SuperAdminBI data={data} loading={loading} />;
  } else if (isCollegeAdmin || isTpo) {
    dashboardView = <CollegeBI data={data} loading={loading} />;
  } else if (isCompanyAdmin || isRecruiter) {
    dashboardView = <CompanyBI data={data} loading={loading} />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Business Intelligence</h1>
        <p className="text-gray-500 dark:text-gray-400">Enterprise aggregated metrics and operational insights.</p>
      </div>
      
      {dashboardView}
      
    </div>
  );
};

export default AnalyticsCommandCenter;
