import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { 
  MapPin, 
  Calendar, 
  AlertCircle,
  Eye,
  Image as ImageIcon,
  UserPlus
} from 'lucide-react';

interface ComplaintCardProps {
  complaint: any;
  onViewDetails: () => void;
  showCitizen?: boolean;
  onQuickAssign?: () => void;
  showAssignButton?: boolean;
}

export function ComplaintCard({ 
  complaint, 
  onViewDetails, 
  showCitizen = false,
  onQuickAssign,
  showAssignButton = false
}: ComplaintCardProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'normal':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'assigned_to_subadmin':
      case 'assigned_to_contractor':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'reopened':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-3 sm:p-5">
        <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2 sm:mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <Badge variant="outline" className="font-mono text-[10px] sm:text-xs">
                {complaint.token}
              </Badge>
              <Badge className={`${getPriorityColor(complaint.priority)} text-[10px] sm:text-xs`}>
                {complaint.priority?.toUpperCase() || 'NORMAL'}
              </Badge>
            </div>
            <h3 className="font-medium mb-1 text-sm sm:text-base break-words">
              {complaint.complaintType}
            </h3>
            {showCitizen && (
              <p className="text-xs sm:text-sm text-muted-foreground break-words">
                By: {complaint.citizenName}
              </p>
            )}
          </div>
        </div>
        <div className="mb-2 sm:mb-3">
          <Badge className={`${getStatusColor(complaint.status)} text-[10px] sm:text-xs`}>
            {formatStatus(complaint.status)}
          </Badge>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2 break-words">
          {complaint.description}
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="size-3 flex-shrink-0" />
            <span className="line-clamp-1 break-words">{complaint.location}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Calendar className="size-3" />
            <span>{formatDate(complaint.createdAt)}</span>
          </div>
        </div>

        {complaint.photos && complaint.photos.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">
            <ImageIcon className="size-3" />
            <span>{complaint.photos.length} photo(s) attached</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={onViewDetails} size="sm" className="flex-1 min-h-[44px] text-xs sm:text-sm">
          <Eye className="size-3 sm:size-4 mr-1 sm:mr-2" />
          View Details
        </Button>
        {showAssignButton && onQuickAssign && (
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onQuickAssign();
            }} 
            size="sm" 
            variant="outline"
            className="flex-1 min-h-[44px] text-xs sm:text-sm"
          >
            <UserPlus className="size-3 sm:size-4 mr-1 sm:mr-2" />
            Assign
          </Button>
        )}
      </div>
      </CardContent>
    </Card>
  );
}