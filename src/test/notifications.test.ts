import {
  clearNotifications,
  getNotifications,
  resetSessionNotifications,
  seedSessionNotifications,
} from "@/utils/notifications";

describe("notification utilities", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("seeds a welcome notification only for non-auth sessions", () => {
    seedSessionNotifications();
    expect(getNotifications()).toHaveLength(1);

    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("auth_token", "demo-token");
    seedSessionNotifications();
    expect(getNotifications()).toHaveLength(0);
  });

  it("resets local notification state completely", () => {
    seedSessionNotifications();
    expect(getNotifications().length).toBeGreaterThan(0);

    resetSessionNotifications();
    expect(getNotifications()).toHaveLength(0);

    seedSessionNotifications();
    expect(getNotifications()).toHaveLength(1);

    clearNotifications();
    expect(getNotifications()).toHaveLength(0);
  });
});
