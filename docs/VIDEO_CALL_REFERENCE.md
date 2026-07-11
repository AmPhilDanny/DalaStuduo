# Video/Voice Call Integration — Research & Decision Record

## Context
Gebeya Dala needs real-time video/voice calls between buyers and providers on the marketplace. This document captures research findings and architectural decisions for implementation.

## Option 1: Jitsi Meet (RECOMMENDED)

### Architecture
- **No hosting required** — uses public `meet.jit.si` instance (free, no signup)
- **React SDK**: `@jitsi/react-sdk` — drop-in `<JitsiMeeting />` component
- **IFrame API fallback**: `JitsiMeetExternalAPI` for full control
- Routes through 8x8's global infrastructure — decent African latency

### Free Tier
- Unlimited meeting duration
- Unlimited participants (practical limit ~8 on public instance)
- No account needed for end users
- Screen sharing, chat, mute/unmute, video toggle built in
- Works on mobile browsers

### React Integration

```tsx
import { JitsiMeeting } from '@jitsi/react-sdk';

function CallRoom({ roomName, user }) {
  return (
    <JitsiMeeting
      domain="meet.jit.si"
      roomName={roomName}
      userInfo={{ displayName: user.full_name }}
      configOverwrite={{
        startWithAudioMuted: true,
        startWithVideoMuted: true,
      }}
      getIFrameRef={(ref) => { ref.style.height = '500px'; }}
    />
  );
}
```

### When to Upgrade to JaaS ($0.35/MAU)
- Need SLA/uptime guarantee
- Need custom branding (remove "Jitsi Meet")
- Exceed rate limits on public instance
- Need JWT-authenticated rooms

### Limitations
- Public instance has no SLA
- Branding shows "Jitsi Meet" (can't customize on free tier)
- Not suitable for confidential data
- 8x8 can see meeting metadata

---

## Option 2: Supabase + Direct WebRTC (P2P Only)

### Architecture
- **Completely free** — no third-party service
- Uses Supabase Realtime channels as WebRTC signaling layer
- Direct P2P connection via STUN (Google public STUN)
- No video data touches any server

### Integration
Based on the LetsTalk open-source pattern:
- `call_signals` table in Postgres for offer/answer/ICE candidate exchange
- Supabase Realtime broadcasts signal messages instantly
- `RTCPeerConnection` in the browser handles media

```tsx
// Signaling flow
const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

// Offerer
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
await supabase.from('call_signals').insert({
  room_id, type: 'offer', sdp: offer.sdp, sender_id: userId
});

// Listener (on receiver side)
supabase.channel(`signals:${roomId}`)
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'call_signals', filter: `room_id=eq.${roomId}` },
    async (payload) => {
      if (payload.new.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: payload.new.sdp }));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await supabase.from('call_signals').insert({ room_id, type: 'answer', sdp: answer.sdp });
      }
    }
  ).subscribe();
```

### Issues
- **No TURN relay** — calls often fail behind African mobile networks (carrier-grade NAT, strict NAT)
- Must self-host a TURN server ($5-10/mo) for reliability
- P2P mesh — each participant uploads to every other. Fine for 1-on-1, degrades beyond 4
- Must build full call UI (mute button, grid layout, screen share, etc.)
- Significant dev time to get production quality

### Best For
- 1-on-1 calls where both parties are on reasonably open networks
- Projects that want zero third-party dependency
- When you have time to build/debug WebRTC

---

## Option 3: PeerJS (P2P Mesh)

### Architecture
- Uses PeerJS public broker for WebRTC signaling
- Pure P2P mesh — host relays to all participants
- Simple API: `const peer = new Peer(); peer.call(remotePeerId, stream);`

### Limitations
- Public broker is a single point of failure
- Same NAT/TURN problems as raw WebRTC
- Host's upstream bandwidth caps meeting size (~4-8 viewers)
- Not production-grade for a platform handling money
- The `forinda-rtc-sdk` fork is promising but pre-1.0, single maintainer

### Verdict
Not recommended for production. Good for prototyping.

---

## P2P vs Conference Mode

Jitsi handles both modes automatically with the same component:

| Scenario | What happens | How to control |
|---|---|---|
| **2 participants** | Jitsi auto-enables P2P mode — direct browser-to-browser WebRTC, lowest latency, no server relay | Default — nothing to configure |
| **3+ participants** | Jitsi switches to JVB (Jitsi Videobridge) — server-relayed for scalability | Default — automatic |

### Forcing explicit control

If you want separate room types:

```tsx
// P2P-optimized (1-on-1 call)
<JitsiMeeting
  domain="meet.jit.si"
  roomName={`p2p-${chatId}`}
  configOverwrite={{
    p2p: { enabled: true },
    disable1On1Mode: false,
    maxLastN: 1,              // only send 1 remote video stream
  }}
/>

// Conference-optimized (3+ meeting)
<JitsiMeeting
  domain="meet.jit.si"
  roomName={`conf-${orderId}`}
  configOverwrite={{
    startWithAudioMuted: true,
    disable1On1Mode: true,  // force server mode always
    maxLastN: -1,            // send all video streams
  }}
/>
```

**Recommendation**: Use a single component. Jitsi's auto-detection is excellent — it switches to P2P when 2 people are in a room, and upgrades to JVB when a third joins. No manual separation needed.

---

## Decision: Jitsi Meet (public meet.jit.si)

**Why Jitsi wins:**
1. Zero infrastructure cost — uses 8x8's free public instance
2. Zero dev time on call UI — Jitsi provides full meeting experience
3. Works on mobile browsers — no native app needed
4. Handles NAT/STUN/TURN transparently
5. Can scale to JaaS or self-host later with same integration

**Room naming convention:**
```
gebeya-{orderId}-{providerId}-{buyerId}
```

### TODO: Implementation
- Add `@jitsi/react-sdk` to package.json
- Create `<VideoCallRoom>` component in `src/components/messaging/`
- Add "Video Call" button in Messages page
- Generate unique room names per order/chat
- Show available/active call status

---

## References
- Jitsi React SDK: https://github.com/jitsi/jitsi-meet-react-sdk
- @jitsi/react-sdk npm: https://www.npmjs.com/package/@jitsi/react-sdk
- IFrame API docs: https://jitsi.github.io/handbook/docs/dev-guide/dev-guide-iframe/
- JaaS pricing: https://www.8x8.com/products/apis/video
- LetsTalk (Supabase+WebRTC example): https://github.com/ToxC7/Letstalk
- forinda-rtc-sdk (alternative): https://github.com/forinda/forinda-rtc-sdk