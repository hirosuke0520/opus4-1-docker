'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dealSchema, DealInput } from '@/lib/schemas';
import { ApiClient } from '@/lib/api';

export default function NewDealPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DealInput>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      stage: 'PROSPECTING',
    },
  });
  
  useEffect(() => {
    fetchLeads();
  }, []);
  
  const fetchLeads = async () => {
    try {
      const data = await ApiClient.get<any>('/leads?pageSize=100');
      setLeads(data.items);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const onSubmit = async (data: DealInput) => {
    try {
      const dealData = {
        ...data,
        expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate).toISOString() : undefined,
      };
      await ApiClient.post('/deals', dealData);
      router.push('/deals');
    } catch (error) {
      console.error('Failed to create deal:', error);
      alert('Failed to create deal. Please try again.');
    }
  };
  
  const handleCancel = () => {
    router.push('/deals');
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">New Deal</h1>
          <p className="mt-2 text-sm text-gray-700">
            Create a new deal in the pipeline
          </p>
        </div>
      </div>
      
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="leadId" className="block text-sm font-medium text-gray-700">
                  Lead *
                </label>
                <select
                  {...register('leadId')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="">Select a lead</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.contactName} - {lead.company.name}
                    </option>
                  ))}
                </select>
                {errors.leadId && (
                  <p className="mt-1 text-sm text-red-600">{errors.leadId.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount *
                </label>
                <input
                  {...register('amount', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                {errors.amount && (
                  <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="stage" className="block text-sm font-medium text-gray-700">
                  Stage
                </label>
                <select
                  {...register('stage')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                >
                  <option value="PROSPECTING">Prospecting</option>
                  <option value="PROPOSAL">Proposal</option>
                  <option value="NEGOTIATION">Negotiation</option>
                  <option value="WON">Won</option>
                  <option value="LOST">Lost</option>
                </select>
                {errors.stage && (
                  <p className="mt-1 text-sm text-red-600">{errors.stage.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="expectedCloseDate" className="block text-sm font-medium text-gray-700">
                  Expected Close Date
                </label>
                <input
                  {...register('expectedCloseDate')}
                  type="datetime-local"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                {errors.expectedCloseDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.expectedCloseDate.message}</p>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Deal'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}