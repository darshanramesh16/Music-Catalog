import { MemoryRouter } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthPage from "../../pages/AuthPage";
import * as apiModule from "../../utils/api";

vi.mock("../../utils/api", async () => {
  const original = await vi.importActual("../../utils/api");
  return {
    ...original,
    api: {
      get: vi.fn(),
      post: vi.fn().mockResolvedValue({ data: { token: "fake-token" } }),
      put: vi.fn(),
      delete: vi.fn(),
    },
    errorMessage: original.errorMessage,
  };
});

const renderAt = (ui, path) =>
  render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);

describe("AuthPage (login)", () => {
  beforeEach(() => {
    apiModule.api.post.mockClear();
    localStorage.clear();
  });

  it("renders the login heading and inputs", () => {
    renderAt(<AuthPage />, "/login");
    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/confirm password/i)).not.toBeInTheDocument();
  });

  it("lets the user type into email and password", async () => {
    renderAt(<AuthPage />, "/login");
    await userEvent.type(screen.getByLabelText(/email/i), "a@b.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "secret123");
    expect(screen.getByLabelText(/email/i)).toHaveValue("a@b.com");
    expect(screen.getByLabelText(/^password$/i)).toHaveValue("secret123");
  });

  it("calls /auth/login and stores a token on submit", async () => {
    renderAt(<AuthPage />, "/login");
    await userEvent.type(screen.getByLabelText(/email/i), "me@test.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "password01");
    await userEvent.click(screen.getByRole("button", { name: /login/i }));

    expect(apiModule.api.post).toHaveBeenCalledWith(
      "/auth/login",
      expect.objectContaining({ email: "me@test.com", password: "password01" }),
    );
    expect(localStorage.getItem("token")).toBe("fake-token");
  });
});

describe("AuthPage (register)", () => {
  beforeEach(() => {
    apiModule.api.post.mockClear();
    localStorage.clear();
  });

  it("renders the confirm password field on register mode", () => {
    renderAt(<AuthPage register />, "/register");
    expect(
      screen.getByRole("heading", { name: /create your account/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("shows a password mismatch error instead of calling the api", async () => {
    renderAt(<AuthPage register />, "/register");
    await userEvent.type(screen.getByLabelText(/email/i), "n@test.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "aaaa1111");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "bbbb2222");
    await userEvent.click(
      screen.getByRole("button", { name: /create account/i }),
    );
    expect(apiModule.api.post).not.toHaveBeenCalled();
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
  });

  it("calls /auth/register when both passwords match", async () => {
    renderAt(<AuthPage register />, "/register");
    await userEvent.type(screen.getByLabelText(/email/i), "n@test.com");
    await userEvent.type(screen.getByLabelText(/^password$/i), "aaaa1111");
    await userEvent.type(screen.getByLabelText(/confirm password/i), "aaaa1111");
    await userEvent.click(
      screen.getByRole("button", { name: /create account/i }),
    );
    expect(apiModule.api.post).toHaveBeenCalledWith(
      "/auth/register",
      expect.objectContaining({ email: "n@test.com" }),
    );
    expect(localStorage.getItem("token")).toBe("fake-token");
  });
});
