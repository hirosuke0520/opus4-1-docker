import { cookies } from 'next/headers';
import { serverFetch } from '@/lib/api';

async function getDashboardData() {
  const cookieStore = cookies();
  const cookieString = cookieStore.toString();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  
  const [leadsData, dealsData, activitiesData] = await Promise.all([
    serverFetch<any>('/leads?pageSize=100', {}, cookieString),
    serverFetch<any>('/deals?pageSize=100', {}, cookieString),
    serverFetch<any>('/activities?completed=false&pageSize=100', {}, cookieString),
  ]);
  
  const todayLeads = leadsData.items.filter((lead: any) => {
    const createdAt = new Date(lead.createdAt);
    return createdAt >= today;
  });
  
  const openDeals = dealsData.items.filter(
    (deal: any) => !['WON', 'LOST'].includes(deal.stage)
  );
  
  const openDealsAmount = openDeals.reduce(
    (sum: number, deal: any) => sum + parseFloat(deal.amount),
    0
  );
  
  const upcomingActivities = activitiesData.items.filter((activity: any) => {
    if (!activity.dueDate) return false;
    const dueDate = new Date(activity.dueDate);
    return dueDate <= weekFromNow && !activity.completed;
  });
  
  return {
    todayLeadsCount: todayLeads.length,
    openDealsAmount,
    openDealsCount: openDeals.length,
    upcomingActivitiesCount: upcomingActivities.length,
    recentLeads: leadsData.items.slice(0, 5),
    recentDeals: dealsData.items.slice(0, 5),
  };
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  
  return (
    <div className="px-4 sm:px-0">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Today's New Leads
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {data.todayLeadsCount}
            </dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Open Deals Value
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              ${data.openDealsAmount.toLocaleString()}
            </dd>
            <dd className="text-sm text-gray-500">
              {data.openDealsCount} deals
            </dd>
          </div>
        </div>
        
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Upcoming Activities (7 days)
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {data.upcomingActivitiesCount}
            </dd>
          </div>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Leads
            </h3>
            <div className="flow-root">
              <ul className="-my-2 divide-y divide-gray-200">
                {data.recentLeads.map((lead: any) => (
                  <li key={lead.id} className="py-2">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {lead.contactName}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {lead.company.name} • {lead.status}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          lead.status === 'NEW' ? 'bg-green-100 text-green-800' :
                          lead.status === 'QUALIFIED' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {lead.status}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Deals
            </h3>
            <div className="flow-root">
              <ul className="-my-2 divide-y divide-gray-200">
                {data.recentDeals.map((deal: any) => (
                  <li key={deal.id} className="py-2">
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {deal.title}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          ${parseFloat(deal.amount).toLocaleString()} • {deal.stage}
                        </p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          deal.stage === 'WON' ? 'bg-green-100 text-green-800' :
                          deal.stage === 'LOST' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {deal.stage}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}