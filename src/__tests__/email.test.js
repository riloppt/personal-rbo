/**
 * Tests for the email-sending utility in src/utils.js
 *
 * sendEmailResend calls the Resend API via fetch. We mock fetch so tests
 * run without network access and we can verify request shape and error handling.
 */
import { sendEmailResend } from "../utils";

describe("sendEmailResend", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("calls the Resend API endpoint with correct method and headers", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email_123" }),
    });

    await sendEmailResend({ to: "user@example.com", subject: "Test", html: "<p>Hi</p>" });

    expect(fetch).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("sends the recipient, subject and html in the request body", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ id: "email_abc" }),
    });

    await sendEmailResend({ to: "client@empresa.pt", subject: "Relatório", html: "<h1>Report</h1>" });

    const body = JSON.parse(fetch.mock.calls[0][1].body);
    expect(body.to).toEqual(["client@empresa.pt"]);
    expect(body.subject).toBe("Relatório");
    expect(body.html).toBe("<h1>Report</h1>");
  });

  it("returns the API response data on success", async () => {
    const mockResponse = { id: "email_xyz", status: "queued" };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await sendEmailResend({ to: "a@b.com", subject: "S", html: "<p/>" });
    expect(result).toEqual(mockResponse);
  });

  it("throws an error with the API message when the response is not ok", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Invalid API key" }),
    });

    await expect(
      sendEmailResend({ to: "a@b.com", subject: "S", html: "<p/>" })
    ).rejects.toThrow("Invalid API key");
  });

  it("throws a fallback error message when the API returns no message field", async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    await expect(
      sendEmailResend({ to: "a@b.com", subject: "S", html: "<p/>" })
    ).rejects.toThrow("Erro ao enviar email");
  });
});
