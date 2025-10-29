export const subscribedStaves: Record<string, number> = {}; // Keeps track of the number of clients subscribed to each staff
export const providerConnected = { value: false }; // Only one provider can be connected at a time
export const app: { value: any } = { value: undefined };
