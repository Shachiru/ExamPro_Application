package lk.ijse.exampro.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class PayHereIntegration implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/v1/payment/**")
                .allowedOrigins("http://localhost:63342")
                .allowedMethods("GET", "POST")
                .allowedHeaders("*");
    }
}