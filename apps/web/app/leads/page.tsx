'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApiClient } from '@/lib/api';

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [leads, setLeads] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  
  const page = parseInt(searchParams.get('page') || '1');
  const q = searchParams.get('q') || '';
  const status = searchParams.get('status') || '';
  const companyId = searchParams.get('companyId') || '';
  
  useEffect(() => {
    fetchLeads();
    fetchCompanies();
  }, [page, q, status, companyId]);
  
  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('pageSize', '20');
      if (q) params.append('q', q);
      if (status) params.append('status', status);
      if (companyId) params.append('companyId', companyId);
      
      const data = await ApiClient.get<any>(`/leads?${params}`);
      setLeads(data.items);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCompanies = async () => {
    try {
      const data = await ApiClient.get<any>('/companies?pageSize=100');
      setCompanies(data.items);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    }
  };
  
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    
    const searchQuery = formData.get('search') as string;
    const statusFilter = formData.get('status') as string;
    const companyFilter = formData.get('company') as string;
    
    if (searchQuery) params.append('q', searchQuery);
    if (statusFilter) params.append('status', statusFilter);
    if (companyFilter) params.append('companyId', companyFilter);
    params.append('page', '1');
    
    router.push(`/leads?${params}`);
  };
  
  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            href="/leads/new"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            Add Lead
          </Link>
        </div>
      </div>
      
      <form onSubmit={handleSearch} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <input
          type="text"
          name="search"
          defaultValue={q}
          placeholder="Search by name, email, phone..."
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
        
        <select
          name="status"
          defaultValue={status}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="QUALIFIED">Qualified</option>
          <option value="LOST">Lost</option>
        </select>
        
        <select
          name="company"
          defaultValue={companyId}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="">All Companies</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
        
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Search
        </button>
      </form>
      
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              {loading ? (
                <div className="p-8 text-center">Loading...</div>
              ) : leads.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No leads found</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Contact
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Company
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Score
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Source
                      </th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <div>
                            <div className="font-medium text-gray-900">
                              {lead.contactName}
                            </div>
                            <div className="text-gray-500">{lead.email}</div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {lead.company.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            lead.status === 'NEW' ? 'bg-green-100 text-green-800' :
                            lead.status === 'QUALIFIED' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {lead.score}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {lead.source}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <Link
                            href={`/leads/${lead.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {totalPages > 1 && (
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => router.push(`/leads?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: (page - 1).toString() })}`)}
            disabled={page === 1}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="inline-flex items-center px-4 py-2 text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => router.push(`/leads?${new URLSearchParams({ ...Object.fromEntries(searchParams), page: (page + 1).toString() })}`)}
            disabled={page === totalPages}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}