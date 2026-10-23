import { BaseController } from "mvc-front-sdk";
import { appConfig } from "#/config";
import { withSession } from "#/lib/auth/session-client";

type RequestBody = Record<string, unknown> | FormData;

/**
 * Root of every API controller. Calls go same-origin to /api/v1; the
 * session cookie rides along and src/proxy.ts swaps it for the bearer token.
 * A 401 triggers one session refresh and a single retry (withSession).
 */
export class BusinessBaseController extends BaseController {
  constructor() {
    super(appConfig.apiUrl);
  }

  protected get<T>(path: string, headers?: HeadersInit): Promise<T> {
    return withSession(() => this.apiService.get<T>(path, headers));
  }

  protected post<T>(
    path: string,
    body?: RequestBody,
    headers?: HeadersInit,
  ): Promise<T> {
    return withSession(() => this.apiService.post<T>(path, body, headers));
  }

  protected patch<T>(
    path: string,
    body?: RequestBody,
    headers?: HeadersInit,
  ): Promise<T> {
    return withSession(() => this.apiService.patch<T>(path, body, headers));
  }

  protected delete<T>(path: string, headers?: HeadersInit): Promise<T> {
    return withSession(() => this.apiService.delete<T>(path, headers));
  }
}
