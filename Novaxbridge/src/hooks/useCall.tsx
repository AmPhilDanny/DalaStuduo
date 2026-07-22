import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "./useSocket";
import { supabase } from "@/integrations/supabase/client";

type CallState = "idle" | "calling" | "ringing" | "connected";
type CallDirection = "outgoing" | "incoming" | null;

interface CallPeer {
  id: string;
  displayName: string;
  avatar_url?: string;
}

interface CallContextType {
  callState: CallState;
  callDirection: CallDirection;
  callPeer: CallPeer | null;
  callRoomId: string | null;
  startCall: (toUserId: string, displayName: string, avatarUrl?: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  cancelCall: () => void;
}

const CallContext = createContext<CallContextType>({
  callState: "idle",
  callDirection: null,
  callPeer: null,
  callRoomId: null,
  startCall: () => {},
  acceptCall: () => {},
  rejectCall: () => {},
  endCall: () => {},
  cancelCall: () => {},
});

export function CallProvider({ children }: { children: ReactNode }) {
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [callState, setCallState] = useState<CallState>("idle");
  const [callDirection, setCallDirection] = useState<CallDirection>(null);
  const [callPeer, setCallPeer] = useState<CallPeer | null>(null);
  const [callRoomId, setCallRoomId] = useState<string | null>(null);

  // Listen for incoming calls
  useEffect(() => {
    if (!socket) return;

    const onIncoming = (data: { from: CallPeer; roomId: string }) => {
      // Don't interrupt an active call
      if (callState !== "idle") return;
      setCallPeer(data.from);
      setCallRoomId(data.roomId);
      setCallDirection("incoming");
      setCallState("ringing");
    };

    const onAccepted = (data: { roomId: string }) => {
      setCallState("connected");
      navigate(`/video-call/${data.roomId}`);
    };

    const onRejected = () => {
      resetCall();
    };

    const onCancelled = () => {
      resetCall();
    };

    const onUnavailable = () => {
      resetCall();
    };

    const onEnded = () => {
      resetCall();
    };

    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:rejected", onRejected);
    socket.on("call:cancelled", onCancelled);
    socket.on("call:unavailable", onUnavailable);
    socket.on("call:ended", onEnded);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:rejected", onRejected);
      socket.off("call:cancelled", onCancelled);
      socket.off("call:unavailable", onUnavailable);
      socket.off("call:ended", onEnded);
    };
  }, [socket, callState, navigate]);

  function resetCall() {
    setCallState("idle");
    setCallDirection(null);
    setCallPeer(null);
    setCallRoomId(null);
  }

  const startCall = useCallback((toUserId: string, displayName: string, avatarUrl?: string) => {
    if (!socket || !toUserId) return;
    const roomId = crypto.randomUUID();
    socket.emit("call:outgoing", {
      to: toUserId,
      roomId,
      callerInfo: { displayName, avatar_url: avatarUrl },
    });
    setCallPeer({ id: toUserId, displayName, avatar_url: avatarUrl });
    setCallRoomId(roomId);
    setCallDirection("outgoing");
    setCallState("calling");
  }, [socket]);

  const acceptCall = useCallback(async () => {
    if (!socket || !callRoomId) return;
    socket.emit("call:accept", { roomId: callRoomId });
    setCallState("connected");
    const { data: { session } } = await supabase.auth.getSession();
    const displayName = session?.user?.user_metadata?.full_name || session?.user?.email || "User";
    navigate(`/video-call/${callRoomId}`, { state: { displayName } });
  }, [socket, callRoomId, navigate]);

  const rejectCall = useCallback(() => {
    if (!socket || !callRoomId) return;
    socket.emit("call:reject", { roomId: callRoomId });
    resetCall();
  }, [socket, callRoomId]);

  const endCall = useCallback(() => {
    if (!socket || !callRoomId) return;
    socket.emit("call:end", { roomId: callRoomId });
    resetCall();
  }, [socket, callRoomId]);

  const cancelCall = useCallback(() => {
    if (!socket || !callRoomId) return;
    socket.emit("call:cancel", { roomId: callRoomId });
    resetCall();
  }, [socket, callRoomId]);

  return (
    <CallContext.Provider
      value={{
        callState,
        callDirection,
        callPeer,
        callRoomId,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        cancelCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  return useContext(CallContext);
}
