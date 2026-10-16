package com.extratechsolution.service.mail;

import org.springframework.web.util.HtmlUtils;

public final class EmailTemplates {

    private EmailTemplates() {}

    private static final String LAYOUT = """
            <!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3f5f9;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f5f9;padding:24px 0;"><tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;">
              <tr><td style="background:#0b1f3a;padding:22px 28px;">
                <span style="font-size:20px;font-weight:700;color:#00e5ff;">ExtraTech</span>
                <span style="font-size:20px;font-weight:700;color:#ffffff;"> Solution</span>
              </td></tr>
              <tr><td style="padding:30px 28px 8px 28px;">
                <h1 style="margin:0 0 14px 0;font-size:22px;color:#0b1f3a;">{{heading}}</h1>
                <div style="font-size:15px;line-height:1.65;color:#374151;">{{body}}</div>
              </td></tr>
              {{button}}
              <tr><td style="padding:22px 28px 28px 28px;font-size:12px;color:#9ca3af;">{{footer}}</td></tr>
            </table></td></tr></table></body></html>
            """;

    private static final String BUTTON = """
            <tr><td style="padding:14px 28px 6px 28px;">
              <a href="{{url}}" style="display:inline-block;background:#0a84ff;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 26px;border-radius:8px;font-size:15px;">{{text}}</a>
            </td></tr>
            """;

    public static String esc(String value) {
        return HtmlUtils.htmlEscape(value == null ? "" : value);
    }

    /** bodyHtml must already be escaped / safe HTML. */
    public static String render(String heading, String bodyHtml, String buttonText, String buttonUrl, String footerHtml) {
        String button = (buttonText == null || buttonUrl == null)
                ? ""
                : BUTTON.replace("{{url}}", esc(buttonUrl)).replace("{{text}}", esc(buttonText));
        return LAYOUT
                .replace("{{heading}}", esc(heading))
                .replace("{{body}}", bodyHtml)
                .replace("{{button}}", button)
                .replace("{{footer}}", footerHtml);
    }

    public static String detailBox(String... lines) {
        StringBuilder sb = new StringBuilder(
                "<div style=\"background:#f3f8ff;border-left:4px solid #0a84ff;border-radius:6px;padding:12px 16px;margin:14px 0;\">");
        for (String line : lines) {
            sb.append("<div style=\"margin:3px 0;\">").append(line).append("</div>");
        }
        return sb.append("</div>").toString();
    }
}