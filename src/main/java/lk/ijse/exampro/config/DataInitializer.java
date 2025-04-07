package lk.ijse.exampro.config;

import lk.ijse.exampro.dto.UserDTO;
import lk.ijse.exampro.service.UserService;
import lk.ijse.exampro.util.VarList;
import lk.ijse.exampro.util.enums.UserRole;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;

@Configuration
public class DataInitializer {

    @Autowired
    private UserService userService;

    @Bean
    public CommandLineRunner initSuperAdmin() {
        return args -> {
            System.out.println("Checking for existing super admin...");
            UserDTO existingSuperAdmin = userService.searchUser("shachirurashmika35@gmail.com");
            if (existingSuperAdmin == null) {
                System.out.println("No super admin found. Creating new super admin...");
                UserDTO superAdminDTO = new UserDTO();
                superAdminDTO.setEmail("shachirurashmika35@gmail.com");
                superAdminDTO.setFullName("Shachiru Rashmika");
                superAdminDTO.setUsername("shachiru");
                superAdminDTO.setPassword("superpassword123");
                superAdminDTO.setRole(UserRole.SUPER_ADMIN);
                superAdminDTO.setActive(true);
                superAdminDTO.setDateOfBirth(LocalDate.of(2000, 3, 14));
                superAdminDTO.setNic("200062132152");
                superAdminDTO.setPhoneNumber("0773322111");

                try {
                    int result = userService.saveUser(superAdminDTO);
                    if (result == VarList.CREATED) {
                        System.out.println("Super Admin created successfully: shachirurashmika35@gmail.com");
                    } else {
                        System.err.println("Failed to create Super Admin. Result code: " + result);
                    }
                } catch (Exception e) {
                    System.err.println("Exception while creating Super Admin: " + e.getMessage());
                    e.printStackTrace();
                }
            } else {
                System.out.println("Super Admin already exists: shachirurashmika35@gmail.com");
            }
        };
    }
}