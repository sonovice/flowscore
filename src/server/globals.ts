export const subscribedStaves: Record<string, number> = {}; // Keeps track of the number of clients subscribed to each staff
export let providerConnected = {value: false}; // Only one provider can be connected at a time
export let app: { value: any } = {value: undefined};