'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { dealSchema, DealInput } from '@/lib/schemas';

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;
  
  const [deal, setDeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<DealInput>({
    resolver: zodResolver(dealSchema),
  });
  
  useEffect(() => {
    fetchDeal();
  }, [dealId]);
  
  const fetchDeal = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<any>(`/deals/${dealId}`);
      setDeal(data);
      
      // Set form values
      setValue('leadId', data.leadId);
      setValue('title', data.title);
      setValue('amount', parseFloat(data.amount));
      setValue('stage', data.stage);
      if (data.expectedCloseDate) {
        const date = new Date(data.expectedCloseDate);
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        setValue('expectedCloseDate', localDate.toISOString().slice(0, 16));
      }
    } catch (error) {
      console.error('Failed to fetch deal:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const onSubmit = async (data: DealInput) => {
    try {
      const updateData: any = {
        title: data.title,
        amount: data.amount,
        stage: data.stage,
      };
      
      if (data.expectedCloseDate) {
        updateData.expectedCloseDate = new Date(data.expectedCloseDate).toISOString();
      }
      
      await ApiClient.patch(`/deals/${dealId}`, updateData);
      await fetchDeal();
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update deal:', error);
      alert('Failed to update deal. Please try again.');
    }
  };
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this deal?')) return;
    
    try {
      await ApiClient.delete(`/deals/${dealId}`);
      router.push('/deals');
    } catch (error) {
      console.error('Failed to delete deal:', error);
      alert('Failed to delete deal. Please try again.');
    }
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    if (deal) {
      setValue('title', deal.title);
      setValue('amount', parseFloat(deal.amount));
      setValue('stage', deal.stage);
      if (deal.expectedCloseDate) {
        const date = new Date(deal.expectedCloseDate);
        const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
        setValue('expectedCloseDate', localDate.toISOString().slice(0, 16));
      }
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  if (!deal) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Deal not found</p>
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-0">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-start sm:justify-between mb-6">
            <div>
              {!isEditing ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-900">{deal.title}</h2>
                  <p className="mt-1 text-3xl font-semibold text-gray-900">
                    ${parseFloat(deal.amount).toLocaleString()}
                  </p>
                </>
              ) : (
                <h2 className="text-2xl font-bold text-gray-900">Edit Deal</h2>
              )}
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => router.push('/deals')}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    Back to Pipeline
                  </button>
                </>
              ) : null}
            </div>
          </div>
          
          {!isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Stage</dt>
                  <dd className="mt-1">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      deal.stage === 'WON' ? 'bg-green-100 text-green-800' :
                      deal.stage === 'LOST' ? 'bg-red-100 text-red-800' :
                      deal.stage === 'PROSPECTING' ? 'bg-gray-100 text-gray-800' :
                      deal.stage === 'PROPOSAL' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {deal.stage}
                    </span>
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Expected Close Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {deal.expectedCloseDate
                      ? new Date(deal.expectedCloseDate).toLocaleDateString()
                      : 'Not set'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(deal.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lead</dt>
                  <dd className="mt-1 text-sm">
                    <a
                      href={`/leads/${deal.lead.id}`}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      {deal.lead.contactName} - {deal.lead.company.name}
                    </a>
                  </dd>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Contact</dt>
                    <dd className="mt-1 text-sm text-gray-900">{deal.lead.contactName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Company</dt>
                    <dd className="mt-1 text-sm text-gray-900">{deal.lead.company.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{deal.lead.email || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-900">{deal.lead.phone || '-'}</dd>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
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
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
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
          )}
        </div>
      </div>
    </div>
  );
}