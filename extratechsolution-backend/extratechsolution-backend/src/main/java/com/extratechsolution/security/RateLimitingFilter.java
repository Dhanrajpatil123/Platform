package com.extratechsolution.security;


import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static final long WINDOW_MS = 60_000; // 1 minute

    private static class Window {
        int count;
        long windowStart = System.currentTimeMillis();
    }

    private final Map<String, Window> buckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        int limit = limitFor(request.getMethod(), request.getRequestURI());

        if (limit > 0) {
            String key = getClientIp(request) + "|" + request.getRequestURI();
            Window window = buckets.computeIfAbsent(key, k -> new Window());

            boolean exceeded;
            synchronized (window) {
                long now = System.currentTimeMillis();
                if (now - window.windowStart > WINDOW_MS) {
                    window.windowStart = now;
                    window.count = 0;
                }
                window.count++;
                exceeded = window.count > limit;
            }

            if (exceeded) {
                response.setStatus(429);
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"error\":\"Too many requests. Please slow down and try again in a minute.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private int limitFor(String method, String path) {
        if ("POST".equals(method) && "/api/auth/login".equals(path)) return 5;
        if ("POST".equals(method) && "/api/auth/signup".equals(path)) return 5;
        if ("POST".equals(method) && "/api/auth/forgot-password".equals(path)) return 3;
        if ("POST".equals(method) && "/api/submissions".equals(path)) return 10;
        if ("POST".equals(method) && "/api/run".equals(path)) return 15;
        return -1; // no limit on anything else
    }

    private String getClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
