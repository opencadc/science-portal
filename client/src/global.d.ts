// types.d.ts or global.d.ts
interface Window {
    runStartupTasks: () => void;
}

// If you need the function to accept parameters, define them like this:
// interface Window {
//   runStartupTasks: (param1: string, param2: number) => void;
// }

// If the function returns something:
// interface Window {
//   runStartupTasks: () => Promise<void>; // for async function
//   // or
//   runStartupTasks: () => string; // for sync function returning string
// }

declare global {
    interface Window {
        runStartupTasks: () => void;
    }
}

export {}; // This ensures the file is treated as a module