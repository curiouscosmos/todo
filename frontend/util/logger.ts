type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function writeLog(level: LogLevel, message: string, context?: LogContext) {
  // Keep third-party logging integration centralized here.
  const payload = context ? [message, context] : [message];

  if (level === "error") {
    console.error(...payload);
    return;
  }

  if (level === "warn") {
    console.warn(...payload);
    return;
  }

  if (level === "debug") {
    console.debug(...payload);
    return;
  }

  console.info(...payload);
}

export const logger = {
  debug: (message: string, context?: LogContext) => writeLog("debug", message, context),
  info: (message: string, context?: LogContext) => writeLog("info", message, context),
  warn: (message: string, context?: LogContext) => writeLog("warn", message, context),
  error: (message: string, context?: LogContext) => writeLog("error", message, context),
};
