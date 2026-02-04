import React from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Permit, PermitStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { Calendar, MapPin, User, GripVertical } from 'lucide-react';

interface KanbanBoardProps {
  permits: Permit[];
  onUpdateStatus: (permitId: string, newStatus: PermitStatus) => void;
  onSelectPermit: (permit: Permit) => void;
}

const COLUMNS: { status: PermitStatus; title: string; color: string }[] = [
  { status: 'pending', title: 'Pending Approval', color: 'bg-gray-100 border-gray-300' },
  { status: 'approved', title: 'Approved', color: 'bg-green-50 border-green-300' },
  { status: 'active', title: 'Active Work', color: 'bg-blue-50 border-blue-300' },
  { status: 'completed', title: 'Completed', color: 'bg-slate-50 border-slate-300' }
];

const permitTypeLabels: Record<string, string> = {
  'hot-work': 'Hot Work',
  'confined-space': 'Confined Space',
  'electrical': 'Electrical',
  'height': 'Work at Height',
  'excavation': 'Excavation',
  'lifting': 'Lifting Operations'
};

const permitTypeColors: Record<string, string> = {
  'hot-work': 'bg-orange-100 text-orange-800',
  'confined-space': 'bg-purple-100 text-purple-800',
  'electrical': 'bg-yellow-100 text-yellow-800',
  'height': 'bg-blue-100 text-blue-800',
  'excavation': 'bg-amber-100 text-amber-800',
  'lifting': 'bg-cyan-100 text-cyan-800'
};

interface PermitCardProps {
  permit: Permit;
  onSelectPermit: (permit: Permit) => void;
}

const PermitCard: React.FC<PermitCardProps> = ({ permit, onSelectPermit }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'PERMIT',
    item: { permit },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }));

  return (
    <div
      ref={(node) => { drag(node); }}
      className={`cursor-move ${isDragging ? 'opacity-50' : 'opacity-100'}`}
      onClick={() => onSelectPermit(permit)}
    >
      <Card className="hover:shadow-md transition-shadow mb-3">
        <CardHeader className="p-3 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <GripVertical className="w-4 h-4 text-gray-400" />
                <CardTitle className="text-sm font-semibold">{permit.permitNumber}</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">{permit.ptwType}</p>
            </div>
          </div>
          <Badge className={`${permitTypeColors[permit.ptwType.toLowerCase()] || 'bg-slate-100'} text-xs`}>
            {permitTypeLabels[permit.ptwType.toLowerCase()] || permit.ptwType}
          </Badge>
        </CardHeader>
        <CardContent className="p-3 pt-2">
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{permit.locationName}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <User className="w-3 h-3" />
              <span>{permit.contractorName}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-3 h-3" />
              <span>{format(new Date(permit.validFrom || permit.createdAt), 'MMM dd, HH:mm')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface KanbanColumnProps {
  status: PermitStatus;
  title: string;
  color: string;
  permits: Permit[];
  onUpdateStatus: (permitId: string, newStatus: string) => void;
  onSelectPermit: (permit: Permit) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  status,
  title,
  color,
  permits,
  onUpdateStatus,
  onSelectPermit
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'PERMIT',
    drop: (item: { permit: Permit }) => {
      if (item.permit.status !== status) {
        onUpdateStatus(item.permit.id, status);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }));

  return (
    <div
      ref={(node) => { drop(node); }}
      className={`flex-1 min-w-[280px] ${color} border-2 rounded-lg p-4 transition-all ${isOver ? 'ring-2 ring-blue-500 ring-offset-2' : ''
        }`}
    >
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-1">{title}</h3>
        <p className="text-sm text-muted-foreground">{permits.length} permits</p>
      </div>
      <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
        {permits.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Drop permits here
          </div>
        ) : (
          permits.map(permit => (
            <PermitCard
              key={permit.id}
              permit={permit}
              onSelectPermit={onSelectPermit}
            />
          ))
        )}
      </div>
    </div>
  );
};

export function KanbanBoard({ permits, onUpdateStatus, onSelectPermit }: KanbanBoardProps) {
  // Filter out expired and rejected permits from kanban view
  const activePermits = permits.filter(p =>
    p.status !== 'expired' && p.status !== 'rejected'
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map(column => {
          const columnPermits = activePermits.filter(p => p.status === column.status);
          return (
            <KanbanColumn
              key={column.status}
              status={column.status}
              title={column.title}
              color={column.color}
              permits={columnPermits}
              onUpdateStatus={onUpdateStatus as (permitId: string, newStatus: string) => void}
              onSelectPermit={onSelectPermit}
            />
          );
        })}
      </div>
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          💡 <strong>Tip:</strong> Drag and drop permits between columns to change their status
        </p>
      </div>
    </DndProvider>
  );
}
