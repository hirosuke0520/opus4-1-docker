'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ApiClient } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { activitySchema, ActivityInput } from '@/lib/schemas';

export default function LeadDetailPage() {
  const params = useParams();
  const leadId = params.id as string;
  
  const [lead, setLead] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'deals' | 'activities'>('activities');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ActivityInput>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      leadId,
      type: 'NOTE',
      completed: false,
    },
  });
  
  useEffect(() => {
    fetchLead();
  }, [leadId]);
  
  const fetchLead = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<any>(`/leads/${leadId}`);
      setLead(data);
    } catch (error) {
      console.error('Failed to fetch lead:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const onSubmitActivity = async (data: ActivityInput) => {
    try {
      await ApiClient.post('/activities', {
        ...data,
        leadId,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      });
      await fetchLead();
      reset();
      setShowActivityForm(false);
    } catch (error) {
      console.error('Failed to create activity:', error);
      alert('Failed to create activity. Please try again.');
    }
  };
  
  const toggleActivityComplete = async (activityId: string, completed: boolean) => {
    try {
      await ApiClient.patch(`/activities/${activityId}`, { completed: !completed });
      await fetchLead();
    } catch (error) {
      console.error('Failed to update activity:', error);
    }
  };
  
  const deleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    
    try {
      await ApiClient.delete(`/activities/${activityId}`);
      await fetchLead();
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Lead not found</p>
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-0">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="sm:flex sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{lead.contactName}</h2>
              <p className="mt-1 text-sm text-gray-600">{lead.company.name}</p>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                {lead.email && <span>{lead.email}</span>}
                {lead.phone && <span>{lead.phone}</span>}
              </div>
            </div>
            <div className="mt-4 sm:mt-0">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                lead.status === 'NEW' ? 'bg-green-100 text-green-800' :
                lead.status === 'QUALIFIED' ? 'bg-blue-100 text-blue-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {lead.status}
              </span>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-4 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Source</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.source}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Score</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.score}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Deals</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.deals?.length || 0}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Activities</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.activities?.length || 0}</dd>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('activities')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'activities'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Activities ({lead.activities?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('deals')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'deals'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Deals ({lead.deals?.length || 0})
            </button>
          </nav>
        </div>
        
        <div className="mt-6">
          {activeTab === 'activities' && (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => setShowActivityForm(!showActivityForm)}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Add Activity
                </button>
              </div>
              
              {showActivityForm && (
                <div className="mb-6 bg-white shadow sm:rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <form onSubmit={handleSubmit(onSubmitActivity)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Type
                        </label>
                        <select
                          {...register('type')}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        >
                          <option value="NOTE">Note</option>
                          <option value="TASK">Task</option>
                          <option value="CALL">Call</option>
                          <option value="EMAIL">Email</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Content
                        </label>
                        <textarea
                          {...register('content')}
                          rows={3}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        {errors.content && (
                          <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Due Date
                        </label>
                        <input
                          {...register('dueDate')}
                          type="datetime-local"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <input
                          {...register('completed')}
                          type="checkbox"
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Mark as completed
                        </label>
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            reset();
                            setShowActivityForm(false);
                          }}
                          className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                {lead.activities?.map((activity: any) => (
                  <div
                    key={activity.id}
                    className={`bg-white shadow sm:rounded-lg p-4 ${
                      activity.completed ? 'opacity-75' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            activity.type === 'NOTE' ? 'bg-gray-100 text-gray-800' :
                            activity.type === 'TASK' ? 'bg-blue-100 text-blue-800' :
                            activity.type === 'CALL' ? 'bg-green-100 text-green-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {activity.type}
                          </span>
                          {activity.completed && (
                            <span className="text-green-600 text-sm">✓ Completed</span>
                          )}
                        </div>
                        <p className={`mt-2 text-sm text-gray-900 ${
                          activity.completed ? 'line-through' : ''
                        }`}>
                          {activity.content}
                        </p>
                        {activity.dueDate && (
                          <p className="mt-1 text-xs text-gray-500">
                            Due: {new Date(activity.dueDate).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 flex space-x-2">
                        <button
                          onClick={() => toggleActivityComplete(activity.id, activity.completed)}
                          className="text-sm text-primary-600 hover:text-primary-900"
                        >
                          {activity.completed ? 'Reopen' : 'Complete'}
                        </button>
                        <button
                          onClick={() => deleteActivity(activity.id)}
                          className="text-sm text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!lead.activities || lead.activities.length === 0) && (
                  <div className="text-center py-6 text-gray-500">
                    No activities yet
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'deals' && (
            <div className="space-y-3">
              {lead.deals?.map((deal: any) => (
                <div key={deal.id} className="bg-white shadow sm:rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{deal.title}</h4>
                      <p className="mt-1 text-sm text-gray-500">
                        ${parseFloat(deal.amount).toLocaleString()}
                      </p>
                      {deal.expectedCloseDate && (
                        <p className="mt-1 text-xs text-gray-500">
                          Expected close: {new Date(deal.expectedCloseDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      deal.stage === 'WON' ? 'bg-green-100 text-green-800' :
                      deal.stage === 'LOST' ? 'bg-red-100 text-red-800' :
                      deal.stage === 'PROSPECTING' ? 'bg-gray-100 text-gray-800' :
                      deal.stage === 'PROPOSAL' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {deal.stage}
                    </span>
                  </div>
                </div>
              ))}
              
              {(!lead.deals || lead.deals.length === 0) && (
                <div className="text-center py-6 text-gray-500">
                  No deals yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}