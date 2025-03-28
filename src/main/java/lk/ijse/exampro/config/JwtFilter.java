package lk.ijse.exampro.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lk.ijse.exampro.service.impl.UserServiceImpl;
import lk.ijse.exampro.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserServiceImpl userService;

    @Value("${jwt.secret}")
    private String secretKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        logger.info("Request URI: " + request.getRequestURI());

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            logger.warn("No Bearer token provided");
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorization.substring(7);
        logger.info("Token: " + token);
        try {
            String email = jwtUtil.extractUsername(token);
            logger.info("Extracted email: " + email);
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = userService.loadUserByUsername(email);
                logger.info("UserDetails: " + userDetails.getUsername() + ", Roles: " + userDetails.getAuthorities());
                if (jwtUtil.validateToken(token, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.info("Authentication set for: " + email);
                    filterChain.doFilter(request, response);
                } else {
                    logger.warn("Token validation failed for: " + email);
                    sendErrorResponse(response, "Invalid or expired token");
                    return;
                }
            } else {
                logger.warn("Email null or already authenticated");
                filterChain.doFilter(request, response);
            }
        } catch (Exception e) {
            logger.error("JWT validation failed: " + e.getMessage());
            sendErrorResponse(response, "Authentication failed: " + e.getMessage());
            return;
        }
    }

    private void sendErrorResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"code\": 401, \"message\": \"" + message + "\", \"data\": null}");
    }
}