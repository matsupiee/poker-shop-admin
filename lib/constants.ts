
// Helper constant for RingGameTypes when running in client
export const RingGameType = {
    WEB_COIN: 'WEB_COIN',
    IN_STORE: 'IN_STORE',
} as const;

export type RingGameTypeKey = keyof typeof RingGameType;
