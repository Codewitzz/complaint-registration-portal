import { Check, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from './ui/badge';

interface TimelineEvent {
  status: string;
  timestamp: string;
  message: string;
}

interface TrackingTimelineProps {
  timeline: TimelineEvent[];
  currentStatus: string;
}

export function TrackingTimeline({ timeline, currentStatus }: TrackingTimelineProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="size-3 sm:size-5 text-yellow-600" />;
      case 'assigned_to_subadmin':
      case 'assigned_to_contractor':
        return <AlertCircle className="size-3 sm:size-5 text-blue-600" />;
      case 'in_progress':
        return <Clock className="size-3 sm:size-5 text-orange-600" />;
      case 'completed':
        return <CheckCircle className="size-3 sm:size-5 text-green-600" />;
      case 'closed':
        return <Check className="size-3 sm:size-5 text-green-600" />;
      case 'contractor_rejected':
      case 'reopened':
        return <XCircle className="size-3 sm:size-5 text-red-600" />;
      default:
        return <Clock className="size-3 sm:size-5 text-gray-600" />;
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
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'contractor_rejected':
      case 'reopened':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
        <h3 className="font-medium text-sm sm:text-base">Complaint Tracking</h3>
        <Badge className={`${getStatusColor(currentStatus)} text-xs sm:text-sm`}>
          {formatStatus(currentStatus)}
        </Badge>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 sm:left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Timeline events */}
        <div className="space-y-4 sm:space-y-6">
          {timeline.map((event, index) => (
            <div key={index} className="relative flex gap-2 sm:gap-4 pl-0">
              {/* Icon */}
              <div className="ml-2 relative z-10 flex-shrink-0 flex items-center justify-center size-6 sm:size-8 bg-white border-2 border-gray-200 rounded-full">
                <div className="size-3 sm:size-5">
                  {getStatusIcon(event.status)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 pb-4 sm:pb-6 min-w-0">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-1 sm:mb-2">
                    <p className="p-3 font-medium text-xs sm:text-sm break-words">{event.message}</p>
                    <Badge variant="outline" className="text-[10px] mt-2 ml-2 mr-2 sm:text-xs whitespace-nowrap w-fit">
                      {formatStatus(event.status)}
                    </Badge>
                  </div>
                  <p className="text-xs p-3 sm:text-sm text-muted-foreground break-words">
                    {formatDate(event.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Status Indicator */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex-shrink-0">
            <div className="size-4 sm:size-5">
              {getStatusIcon(currentStatus)}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm break-words">
              <strong>Current Status:</strong> {formatStatus(currentStatus)}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 break-words">
              Last updated: {formatDate(timeline[timeline.length - 1]?.timestamp || new Date().toISOString())}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
