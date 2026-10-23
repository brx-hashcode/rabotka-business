import { describe, expect, it, vi } from "vitest";

import { refreshSession, setSessionExpiredHandler, withSession } from "./session-client";

const unauthorized = () => Object.assign(new Error("Unauthorized"), { statusCode: 401 });

function deferredFetch() {
  let resolve!: (ok: boolean) => void;
  const fetchImpl = vi.fn(
    () =>
      new Promise<Response>((r) => {
        resolve = (ok) => r(new Response("{}", { status: ok ? 200 : 401 }));
      }),
  );
  return { fetchImpl, resolve: (ok: boolean) => resolve(ok) };
}

describe("refreshSession", () => {
  it("spends the single-use refresh token once for parallel 401s", async () => {
    const { fetchImpl, resolve } = deferredFetch();
    const a = refreshSession(fetchImpl as unknown as typeof fetch);
    const b = refreshSession(fetchImpl as unknown as typeof fetch);
    resolve(true);
    await expect(Promise.all([a, b])).resolves.toEqual([true, true]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("reports a refused refresh as false, and lets the next burst try again", async () => {
    const first = deferredFetch();
    const failed = refreshSession(first.fetchImpl as unknown as typeof fetch);
    first.resolve(false);
    await expect(failed).resolves.toBe(false);

    const second = deferredFetch();
    const retried = refreshSession(second.fetchImpl as unknown as typeof fetch);
    second.resolve(true);
    await expect(retried).resolves.toBe(true);
    expect(second.fetchImpl).toHaveBeenCalledTimes(1);
  });
});

describe("withSession", () => {
  it("retries once after a successful refresh", async () => {
    const call = vi.fn().mockRejectedValueOnce(unauthorized()).mockResolvedValue("ok");
    await expect(withSession(call, async () => true)).resolves.toBe("ok");
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("hands off to the expiry handler when the refresh fails", async () => {
    const onExpired = vi.fn();
    setSessionExpiredHandler(onExpired);
    const call = vi.fn().mockRejectedValue(unauthorized());
    await expect(withSession(call, async () => false)).rejects.toMatchObject({
      statusCode: 401,
    });
    expect(call).toHaveBeenCalledTimes(1);
    expect(onExpired).toHaveBeenCalledTimes(1);
  });

  it("does not refresh for other errors", async () => {
    const refresh = vi.fn();
    const call = vi.fn().mockRejectedValue(Object.assign(new Error("x"), { statusCode: 500 }));
    await expect(withSession(call, refresh)).rejects.toMatchObject({ statusCode: 500 });
    expect(refresh).not.toHaveBeenCalled();
  });
});
