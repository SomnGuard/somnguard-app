import { lazy, Suspense } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { StreamSession } from '../services/streaming.service';

type Props = {
  session: StreamSession;
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (message: string) => void;
  onTrack: (available: boolean) => void;
};

export function LiveKitVideoView({ session, onConnected, onDisconnected, onError, onTrack }: Props) {
  if (!session.livekitUrl || !session.livekitToken) return null;

  return (
    <Suspense fallback={<View style={styles.loading}><ActivityIndicator /></View>}>
      <NativeLiveKitVideoView
        session={session}
        onConnected={onConnected}
        onDisconnected={onDisconnected}
        onError={onError}
        onTrack={onTrack}
      />
    </Suspense>
  );
}

const NativeLiveKitVideoView = lazy(() => import('./NativeLiveKitVideoView'));

const styles = StyleSheet.create({
  loading: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
