import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface DealCardProps {
  deal: any;
  isDragging?: boolean;
  onUpdateStage?: (dealId: string, newStage: string) => void;
  stages?: any[];
}

export default function DealCard({ deal, isDragging, onUpdateStage, stages }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: deal.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow ${
        isDragging ? 'shadow-lg' : ''
      } ${isSortableDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      {...attributes}
      {...listeners}
    >
      <a 
        href={`/deals/${deal.id}`}
        className="block"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-medium text-gray-900 mb-1 hover:text-primary-600">{deal.title}</h3>
        <p className="text-sm text-gray-600 mb-2">
          ${parseFloat(deal.amount).toLocaleString()}
        </p>
        <p className="text-xs text-gray-500 mb-2">
          {deal.lead?.company?.name} - {deal.lead?.contactName}
        </p>
        {deal.expectedCloseDate && (
          <p className="text-xs text-gray-500 mb-3">
            Close: {new Date(deal.expectedCloseDate).toLocaleDateString()}
          </p>
        )}
      </a>
      
      {onUpdateStage && stages && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Move to stage (keyboard accessible):
          </label>
          <select
            className="block w-full text-xs rounded border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            value={deal.stage}
            onChange={(e) => onUpdateStage(deal.id, e.target.value)}
            onClick={(e) => e.stopPropagation()}
          >
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}