import { useEffect, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface B2BVideoCallProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomName: string;
  userName: string;
  meetingTitle?: string;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => {
      executeCommand: (cmd: string, ...args: unknown[]) => void;
      addListener: (event: string, handler: (...args: unknown[]) => void) => void;
      dispose: () => void;
    };
  }
}

export default function B2BVideoCall({ open, onOpenChange, roomName, userName, meetingTitle }: B2BVideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{ executeCommand: (cmd: string, ...args: unknown[]) => void; dispose: () => void }>(null);

  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    if (!open) return;

    const existing = document.querySelector<HTMLScriptElement>('script[src*="external_api.js"]');
    if (existing) {
      if (typeof window.JitsiMeetExternalAPI !== 'undefined') {
        setScriptLoaded(true);
      }
      return;
    }

    setScriptLoaded(false);
    setScriptError(false);

    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptError(true);
    document.head.appendChild(script);

    return () => {
      if (!existing) {
        script.remove();
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open || !scriptLoaded || !containerRef.current || !window.JitsiMeetExternalAPI) return;

    setParticipantCount(0);
    setIsAudioMuted(false);
    setIsVideoMuted(false);

    const domain = 'meet.jit.si';
    const options = {
      roomName,
      parentNode: containerRef.current,
      userInfo: { displayName: userName },
      interfaceConfigOverwrite: {
        TOOLBAR_ALWAYS_VISIBLE: false,
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        FILM_STRIP_MAX_HEIGHT: 0,
        VERTICAL_FILMSTRIP: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_POWERED_BY: false,
        HIDE_INVITE_MORE_HEADER: true,
        DISPLAY_WELCOME_FOOTER: false,
        DISPLAY_WELCOME_PAGE_CONTENT: false,
        HIDE_HELP_BUTTON: true,
        HIDE_KICK_BUTTON_FOR_GUESTS: true,
        HIDE_LOCAL_URL: true,
        HIDE_LOGO: true,
        HIDE_ROOM_URL: true,
      },
      configOverwrite: {
        prejoinPageEnabled: false,
        disableTileView: true,
        disableInviteFunctions: true,
        doNotStoreRoom: true,
        hideConferenceSubject: true,
        toolbarButtons: [],
        disableDeepLinking: true,
      },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);
    apiRef.current = api;

    api.addListener('videoConferenceJoined', () => {
      setParticipantCount(1);
    });

    api.addListener('participantJoined', () => {
      setParticipantCount((c) => c + 1);
    });

    api.addListener('participantLeft', () => {
      setParticipantCount((c) => Math.max(0, c - 1));
    });

    api.addListener('audioMuteStatusChanged', ({ muted }: { muted: boolean }) => {
      setIsAudioMuted(muted);
    });

    api.addListener('videoMuteStatusChanged', ({ muted }: { muted: boolean }) => {
      setIsVideoMuted(muted);
    });

    return () => {
      api.dispose();
      apiRef.current = undefined;
    };
  }, [open, scriptLoaded, roomName, userName]);

  const toggleAudio = useCallback(() => {
    apiRef.current?.executeCommand('toggleAudio');
  }, []);

  const toggleVideo = useCallback(() => {
    apiRef.current?.executeCommand('toggleVideo');
  }, []);

  const hangup = useCallback(() => {
    apiRef.current?.executeCommand('hangup');
    apiRef.current?.dispose();
    apiRef.current = undefined;
    onOpenChange(false);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) {
        apiRef.current?.dispose();
        apiRef.current = undefined;
      }
      onOpenChange(o);
    }}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[800px] h-[90vh] max-h-[700px] p-0 gap-0 overflow-hidden">
        <div className="relative w-full h-full flex flex-col bg-black">
          <div className="flex-1 relative min-h-0">
            {scriptError ? (
              <div className="absolute inset-0 flex items-center justify-center text-white/60 text-sm">
                Failed to load video. Please check your connection.
              </div>
            ) : !scriptLoaded ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/60" />
              </div>
            ) : (
              <>
                <div ref={containerRef} className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full" />
                {participantCount <= 1 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-white/50 text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">
                      {meetingTitle ? `${meetingTitle} — ` : ''}Waiting for others to join...
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 p-4 bg-black/80">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              className={`rounded-full w-12 h-12 ${
                isAudioMuted
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isAudioMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVideo}
              className={`rounded-full w-12 h-12 ${
                isVideoMuted
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isVideoMuted ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={hangup}
              className="rounded-full w-12 h-12 bg-red-500 text-white hover:bg-red-600"
            >
              <PhoneOff className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
