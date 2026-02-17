export const EVENTS = {
    AGENTS_CHANGED: 'agents_changed',
};

export const emitEvent = (eventName: string, detail?: any) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
};
