// Internal Logging
export function logInternalError(message: string, error?: any, context?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: "error",
    message,
    error: error?.message || error,
    context,
  };
  console.error(`[${timestamp}] ERROR:`, logEntry);
  appendLogEntry(logEntry);
}

export function logInternalInfo(message: string, context?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: "info",
    message,
    context,
  };
  console.log(`[${timestamp}] INFO:`, logEntry);
  appendLogEntry(logEntry);
}

export function logInternalWarn(message: string, context?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: "warn",
    message,
    context,
  };
  console.warn(`[${timestamp}] WARN:`, logEntry);
  appendLogEntry(logEntry);
}

export function logInternalDebug(message: string, context?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: "debug",
    message,
    context,
  };
  console.debug(`[${timestamp}] DEBUG:`, logEntry);
  appendLogEntry(logEntry);
}

function appendLogEntry(entry: any) {
  try {
    const logs = JSON.parse(localStorage.getItem("amber-internal-logs") || "[]");
    logs.push(entry);
    if (logs.length > 1000) logs.shift();
    localStorage.setItem("amber-internal-logs", JSON.stringify(logs));
  } catch {}
}