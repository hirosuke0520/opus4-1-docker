import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import DealCard from './deal-card';

interface DealColumnProps {
  stage: {
    id: string;
    label: string;
    color: string;
  };
  deals: any[];
  onUpdateStage: (dealId: string, newStage: string) => void;
  stages: any[];
}

export default function DealColumn({ stage, deals, onUpdateStage, stages }: DealColumnProps) {
  const { setNodeRef } = useDroppable({
    id: stage.id,
  });
  
  const totalAmount = deals.reduce((sum, deal) => sum + parseFloat(deal.amount), 0);
  
  return (
    <div className="flex-shrink-0 w-80">
      <div className={`${stage.color} rounded-t-lg px-4 py-2`}>
        <h2 className="font-semibold text-gray-900">{stage.label}</h2>
        <p className="text-sm text-gray-600">
          {deals.length} deals • ${totalAmount.toLocaleString()}
        </p>
      </div>
      
      <div
        ref={setNodeRef}
        className="bg-gray-50 min-h-[500px] p-2 rounded-b-lg border-x border-b border-gray-200"
      >
        <SortableContext
          items={deals.map(d => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {deals.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No deals in {stage.label.toLowerCase()}
              </div>
            ) : (
              deals.map((deal) => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onUpdateStage={onUpdateStage}
                  stages={stages}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}