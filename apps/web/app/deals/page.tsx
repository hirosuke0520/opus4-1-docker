'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ApiClient } from '@/lib/api';
import DealCard from '@/components/deal-card';
import DealColumn from '@/components/deal-column';

const STAGES = [
  { id: 'PROSPECTING', label: 'Prospecting', color: 'bg-gray-100' },
  { id: 'PROPOSAL', label: 'Proposal', color: 'bg-blue-100' },
  { id: 'NEGOTIATION', label: 'Negotiation', color: 'bg-yellow-100' },
  { id: 'WON', label: 'Won', color: 'bg-green-100' },
  { id: 'LOST', label: 'Lost', color: 'bg-red-100' },
];

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [dealsByStage, setDealsByStage] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [activeDeal, setActiveDeal] = useState<any>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );
  
  useEffect(() => {
    fetchDeals();
  }, []);
  
  const fetchDeals = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.get<any>('/deals?pageSize=100');
      setDeals(data.items);
      
      const grouped = STAGES.reduce((acc, stage) => {
        acc[stage.id] = data.items.filter((deal: any) => deal.stage === stage.id);
        return acc;
      }, {} as Record<string, any[]>);
      
      setDealsByStage(grouped);
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const deal = deals.find(d => d.id === active.id);
    setActiveDeal(deal);
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDeal(null);
    
    if (!over) return;
    
    const dealId = active.id as string;
    const newStage = over.id as string;
    
    // Find the deal and its current stage
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === newStage) return;
    
    const oldStage = deal.stage;
    
    // Optimistic update
    const updatedDeal = { ...deal, stage: newStage };
    const updatedDeals = deals.map(d => d.id === dealId ? updatedDeal : d);
    setDeals(updatedDeals);
    
    const newDealsByStage = { ...dealsByStage };
    newDealsByStage[oldStage] = newDealsByStage[oldStage].filter(d => d.id !== dealId);
    newDealsByStage[newStage] = [...newDealsByStage[newStage], updatedDeal];
    setDealsByStage(newDealsByStage);
    
    try {
      // Update on server
      await ApiClient.patch(`/deals/${dealId}`, { stage: newStage });
    } catch (error) {
      // Rollback on error
      console.error('Failed to update deal stage:', error);
      setDeals(deals);
      
      const rolledBackDealsByStage = { ...dealsByStage };
      rolledBackDealsByStage[newStage] = rolledBackDealsByStage[newStage].filter(d => d.id !== dealId);
      rolledBackDealsByStage[oldStage] = [...rolledBackDealsByStage[oldStage], deal];
      setDealsByStage(rolledBackDealsByStage);
      
      alert('Failed to update deal stage. Please try again.');
    }
  };
  
  const updateDealStageViaButton = async (dealId: string, newStage: string) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === newStage) return;
    
    const oldStage = deal.stage;
    
    // Optimistic update
    const updatedDeal = { ...deal, stage: newStage };
    const updatedDeals = deals.map(d => d.id === dealId ? updatedDeal : d);
    setDeals(updatedDeals);
    
    const newDealsByStage = { ...dealsByStage };
    newDealsByStage[oldStage] = newDealsByStage[oldStage].filter(d => d.id !== dealId);
    newDealsByStage[newStage] = [...newDealsByStage[newStage], updatedDeal];
    setDealsByStage(newDealsByStage);
    
    try {
      await ApiClient.patch(`/deals/${dealId}`, { stage: newStage });
    } catch (error) {
      // Rollback
      console.error('Failed to update deal stage:', error);
      setDeals(deals);
      
      const rolledBackDealsByStage = { ...dealsByStage };
      rolledBackDealsByStage[newStage] = rolledBackDealsByStage[newStage].filter(d => d.id !== dealId);
      rolledBackDealsByStage[oldStage] = [...rolledBackDealsByStage[oldStage], deal];
      setDealsByStage(rolledBackDealsByStage);
      
      alert('Failed to update deal stage. Please try again.');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading deals...</div>
      </div>
    );
  }
  
  return (
    <div className="px-4 sm:px-0">
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Deals Pipeline</h1>
          <p className="mt-2 text-sm text-gray-700">
            Drag and drop deals between stages or use the buttons to update their status
          </p>
        </div>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <DealColumn
              key={stage.id}
              stage={stage}
              deals={dealsByStage[stage.id] || []}
              onUpdateStage={updateDealStageViaButton}
              stages={STAGES}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeDeal ? <DealCard deal={activeDeal} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}