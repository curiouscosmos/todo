export type ProblemDetails = {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public problem?: ProblemDetails,
  ) {
    super(message);
  }
}

const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export async function apiClient<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError("Unable to reach the API. Check that the backend is running.", 0);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const data = parseJson(text, response.status);

  if (!response.ok) {
    // Normalize API problem details so callers can handle every failure path through ApiError.
    const problem = data as ProblemDetails | undefined;
    throw new ApiError(problem?.detail ?? problem?.title ?? "Request failed.", response.status, problem);
  }

  return data as T;
}

function parseJson(text: string, status: number) {
  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text);
  } catch {
    // A 2xx with invalid JSON is still a client-visible API failure.
    throw new ApiError("The API returned an invalid response.", status);
  }
}
