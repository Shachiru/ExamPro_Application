package lk.ijse.exampro.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lk.ijse.exampro.entity.User;
import lk.ijse.exampro.repository.UserRepository;
import lk.ijse.exampro.service.impl.UserServiceImpl;
import lk.ijse.exampro.util.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger logger = LoggerFactory.getLogger(JwtFilter.class);

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserServiceImpl userService;

    @Autowired
    private UserRepository userRepository;

    @Value("${jwt.secret}")
    private String secretKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        logger.info("Request URI: {}", request.getRequestURI());

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            logger.warn("No Bearer token provided");
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorization.substring(7);
        logger.info("Token: {}", token);
        try {
            String email = jwtUtil.extractUsername(token);
            logger.info("Extracted email: {}", email);
            if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Check if user is active
                User user = userRepository.findByEmail(email).orElse(null);
                if (user == null) {
                    logger.warn("User not found for email: {}", email);
                    sendErrorResponse(response, "User not found", HttpServletResponse.SC_NOT_FOUND);
                    return;
                }
                if (!user.isActive()) {
                    logger.warn("User account is deactivated for email: {}", email);
                    sendErrorResponse(response, "Account is deactivated", HttpServletResponse.SC_FORBIDDEN);
                    return;
                }

                UserDetails userDetails = userService.loadUserByUsername(email);
                logger.info("UserDetails: {}, Roles: {}", userDetails.getUsername(), userDetails.getAuthorities());
                if (jwtUtil.validateToken(token, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    logger.info("Authentication set for: {}", email);
                    filterChain.doFilter(request, response);
                } else {
                    logger.warn("Token validation failed for: {}", email);
                    sendErrorResponse(response, "Invalid or expired token", HttpServletResponse.SC_UNAUTHORIZED);
                    return;
                }
            } else {
                logger.warn("Email null or already authenticated");
                filterChain.doFilter(request, response);
            }
        } catch (Exception e) {
            logger.error("JWT validation failed: {}", e.getMessage());
            sendErrorResponse(response, "Authentication failed: " + e.getMessage(), HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }
    }

    private void sendErrorResponse(HttpServletResponse response, String message, int status) throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.getWriter().write("{\"code\": " + status + ", \"message\": \"" + message + "\", \"data\": null}");
    }
}