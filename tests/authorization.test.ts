import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  currentUser: null as null | { id: string },
  listTransactions: vi.fn(async () => ({ items: [], total: 0, page: 1, pages: 1 })),
}));

vi.mock("@/lib/session", () => ({ getRequestUser: vi.fn(async () => mocks.currentUser) }));
vi.mock("@/lib/finance/queries", () => ({ listTransactions: mocks.listTransactions }));

import { GET } from "@/app/api/transactions/route";

describe("transaction API authorization", () => {
  beforeEach(() => { mocks.currentUser = null; mocks.listTransactions.mockClear(); });

  it("rejects requests without an authenticated session", async () => {
    const response = await GET(new Request("http://localhost/api/transactions"));
    expect(response.status).toBe(401);
    expect(mocks.listTransactions).not.toHaveBeenCalled();
  });

  it("scopes every list request to the authenticated user", async () => {
    mocks.currentUser = { id: "user-a" };
    await GET(new Request("http://localhost/api/transactions"));
    expect(mocks.listTransactions).toHaveBeenLastCalledWith("user-a", {});

    mocks.currentUser = { id: "user-b" };
    await GET(new Request("http://localhost/api/transactions"));
    expect(mocks.listTransactions).toHaveBeenLastCalledWith("user-b", {});
    expect(mocks.listTransactions).toHaveBeenCalledTimes(2);
  });
});
