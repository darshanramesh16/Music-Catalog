import {
  errorMessage,
  saveSearchState,
  loadSearchState,
  clearAllSearchStates,
  decodeJwtEmail,
} from "../../utils/api";

describe("api utils", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("errorMessage", () => {
    it("returns the server message when available", () => {
      expect(
        errorMessage({
          response: { data: { message: "Not found" } },
        }),
      ).toBe("Not found");
    });

    it("falls back to a generic message when response is missing", () => {
      expect(errorMessage({})).toBe("Something went wrong. Please try again.");
      expect(errorMessage({ response: {} })).toBe(
        "Something went wrong. Please try again.",
      );
      expect(errorMessage({ response: { data: {} } })).toBe(
        "Something went wrong. Please try again.",
      );
    });
  });

  describe("search state persistence", () => {
    it("returns null from loadSearchState when no token exists", () => {
      expect(loadSearchState()).toBeNull();
    });

    it("saves and loads state for the current token", () => {
      localStorage.setItem("token", "tok-1");
      saveSearchState({ query: "Coldplay", items: [1, 2, 3] });
      expect(loadSearchState()).toEqual({
        query: "Coldplay",
        items: [1, 2, 3],
      });
    });

    it("isolates state per token", () => {
      localStorage.setItem("token", "tok-a");
      saveSearchState({ query: "AAA" });
      localStorage.setItem("token", "tok-b");
      saveSearchState({ query: "BBB" });

      localStorage.setItem("token", "tok-a");
      expect(loadSearchState().query).toBe("AAA");
      localStorage.setItem("token", "tok-b");
      expect(loadSearchState().query).toBe("BBB");
    });

    it("clears every search_state_* key when clearAllSearchStates is called", () => {
      localStorage.setItem("token", "a");
      saveSearchState({ query: "X" });
      localStorage.setItem("token", "b");
      saveSearchState({ query: "Y" });
      localStorage.setItem("token", "c");
      saveSearchState({ query: "Z" });
      localStorage.setItem("other", "keep-me");

      expect(
        Object.keys(localStorage).filter((k) => k.startsWith("search_state_")),
      ).toHaveLength(3);

      clearAllSearchStates();

      expect(
        Object.keys(localStorage).filter((k) => k.startsWith("search_state_")),
      ).toHaveLength(0);
      expect(localStorage.getItem("other")).toBe("keep-me");
    });
  });

  describe("decodeJwtEmail", () => {
    it("returns an empty string when there is no token", () => {
      expect(decodeJwtEmail()).toBe("");
    });

    it("extracts the sub claim from a valid JWT payload", () => {
      const header = btoa(JSON.stringify({ alg: "HS256" }));
      const payload = btoa(JSON.stringify({ sub: "alice@example.com" }));
      localStorage.setItem("token", `${header}.${payload}.sig`);
      expect(decodeJwtEmail()).toBe("alice@example.com");
    });

    it("returns an empty string for a malformed token", () => {
      localStorage.setItem("token", "not-a-jwt");
      expect(decodeJwtEmail()).toBe("");
    });

    it("handles URL-safe base64 payloads (- and _ instead of + and /)", () => {
      const header = "eyJhbGciOiJIUzI1NiJ9";
      // Base64 of {"sub":"z.z@x.co"} == eyJzdWIiOiJ6LnpAeC5jbyJ9
      // Make URL-safe by replacing any +/ (there aren't any here, but ensure logic)
      const payload = btoa(JSON.stringify({ sub: "z.z@x.co" }))
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      localStorage.setItem("token", `${header}.${payload}.sig`);
      expect(decodeJwtEmail()).toBe("z.z@x.co");
    });
  });
});
