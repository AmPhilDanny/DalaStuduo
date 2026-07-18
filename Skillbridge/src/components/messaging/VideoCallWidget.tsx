import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';
import VideoCallDialog from '@/components/messaging/VideoCallDialog';

interface VideoCallWidgetProps {
  conversationId?: string;
  orderId?: string;
  userName: string;
  /** Optional: if true, shows a small icon button instead of full button */
  compact?: boolean;
}

export default function VideoCallWidget({
  conversationId,
  orderId,
  userName,
  compact,
}: VideoCallWidgetProps) {
  const [callOpen, setCallOpen] = useState(false);

  const roomId = [conversationId, orderId, crypto.randomUUID().slice(0, 8)]
    .filter(Boolean)
    .join('-')
    .slice(0, 24);

  const handleStartCall = () => {
    setCallOpen(true);
  };

  return (
    <>
      <Button
        onClick={handleStartCall}
        variant={compact ? 'ghost' : 'default'}
        size={compact ? 'icon' : 'default'}
        className={compact ? 'h-9 w-9' : 'gap-1.5'}
        title="Start video call"
      >
        <Video className="w-4 h-4" />
        {!compact && 'Video Call'}
      </Button>

      <VideoCallDialog
        open={callOpen}
        onOpenChange={setCallOpen}
        roomId={roomId}
        displayName={userName}
      />
    </>
  );
}
