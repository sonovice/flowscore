export const worker = new Worker(
    new URL('./verovioWorker.ts', import.meta.url),
    {
        type: 'module',
    }
);