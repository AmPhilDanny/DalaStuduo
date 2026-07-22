import { Phone, PhoneOff, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useCall } from "@/hooks/useCall";

export default function IncomingCallDialog() {
  const { callState, callDirection, callPeer, acceptCall, rejectCall } = useCall();

  if (callState !== "ringing" || callDirection !== "incoming" || !callPeer) return null;

  const initials = callPeer.displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <Card className="w-full max-w-sm mx-4 animate-in slide-in-from-bottom-4 duration-300">
        <CardContent className="flex flex-col items-center gap-4 pt-8 pb-6">
          <Avatar className="h-20 w-20 ring-4 ring-primary/20">
            <AvatarImage src={callPeer.avatar_url} alt={callPeer.displayName} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <p className="text-lg font-semibold">{callPeer.displayName}</p>
            <p className="text-sm text-muted-foreground">Incoming Video Call</p>
          </div>
          <div className="flex gap-4">
            <Button
              variant="destructive"
              size="lg"
              className="h-14 w-14 rounded-full"
              onClick={rejectCall}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            <Button
              variant="default"
              size="lg"
              className="h-14 w-14 rounded-full bg-green-600 hover:bg-green-700"
              onClick={acceptCall}
            >
              <Video className="h-6 w-6" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
