import { client as generatedClient } from "../../generated/client.gen";
import { readApiBaseUrl } from "./base-url";
import { getAccessToken } from "./token";

export const REQUEST_TIMEOUT_MS = 15_000;

export class RequestTimeoutError extends Error {
  constructor() {
    super("The request timed out");
    this.name = "RequestTimeoutError";
  }
}

type ClientMethod =
  | "connect"
  | "delete"
  | "get"
  | "head"
  | "options"
  | "patch"
  | "post"
  | "put"
  | "request"
  | "trace";

const deadlineTimers = new WeakMap<AbortSignal, ReturnType<typeof setTimeout>>();

function failureFor(signal: AbortSignal): Error {
  if (signal.reason instanceof RequestTimeoutError) return signal.reason;
  return new DOMException("The operation was aborted.", "AbortError");
}

function requestSignal(input: RequestInfo | URL, init?: RequestInit): AbortSignal | undefined {
  if (init?.signal) return init.signal;
  if (input instanceof Request) return input.signal;
  return undefined;
}

function clearDeadline(signal: AbortSignal | undefined): void {
  if (!signal) return;
  const timer = deadlineTimers.get(signal);
  if (timer) clearTimeout(timer);
}

function raceAbort(work: Promise<Response>, signal: AbortSignal | undefined): Promise<Response> {
  if (!signal) return work;
  if (signal.aborted) return Promise.reject(failureFor(signal));
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(failureFor(signal));
    signal.addEventListener("abort", onAbort, { once: true });
    work.then(
      (response) => {
        signal.removeEventListener("abort", onAbort);
        if (signal.aborted) reject(failureFor(signal));
        else resolve(response);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

// A fetch that settles after the deadline is dropped. The caller already failed the request.
async function fetchUntilAbort(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const signal = requestSignal(input, init);
  try {
    const response = await raceAbort(globalThis.fetch(input, init), signal);
    if (signal?.aborted) throw failureFor(signal);
    return response;
  } finally {
    clearDeadline(signal);
  }
}

function withDeadline(request: Request): Request {
  const headers = new Headers(request.headers);
  const token = getAccessToken();
  if (token.length > 0) headers.set("Authorization", `Bearer ${token}`);
  else headers.delete("Authorization");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new RequestTimeoutError()), REQUEST_TIMEOUT_MS);
  deadlineTimers.set(controller.signal, timer);
  controller.signal.addEventListener("abort", () => clearDeadline(controller.signal), { once: true });
  if (request.signal?.aborted) controller.abort();
  else request.signal?.addEventListener("abort", () => controller.abort(), { once: true });

  // Copy the body as the generated client serialized it, including Vietnamese text.
  return new Request(request, { headers, signal: controller.signal });
}

function stripToken(error: unknown): unknown {
  const token = getAccessToken();
  if (token.length === 0) return error;
  if (typeof error === "string") return error.split(token).join("");
  if (error instanceof Error) {
    const next = new Error(error.message.split(token).join(""));
    next.name = error.name;
    return next;
  }
  if (typeof error === "object") {
    try {
      return JSON.parse(JSON.stringify(error).split(token).join(""));
    } catch {
      return error;
    }
  }
  return error;
}

function bindConfig(): void {
  // Stay on the generator's fields shape. Its hooks read `.data` and return that body, so the Request stays out of the cache. Forcing responseStyle "data" would make those hooks return undefined.
  generatedClient.setConfig({
    baseUrl: readApiBaseUrl(),
    fetch: fetchUntilAbort,
    throwOnError: true,
  });
}

function wrapMethod(name: ClientMethod): void {
  const original = generatedClient[name].bind(generatedClient) as (typeof generatedClient)[ClientMethod];
  // Read VITE_API_BASE_URL on each call. Module init would freeze the value before a test sets it.
  generatedClient[name] = ((options: never) => {
    bindConfig();
    return original(options);
  }) as (typeof generatedClient)[ClientMethod];
}

const methods: ClientMethod[] = [
  "connect",
  "delete",
  "get",
  "head",
  "options",
  "patch",
  "post",
  "put",
  "request",
  "trace",
];

generatedClient.interceptors.request.use((request) => withDeadline(request));
generatedClient.interceptors.error.use((error) => stripToken(error));
bindConfig();
for (const name of methods) wrapMethod(name);

export const client = generatedClient;
