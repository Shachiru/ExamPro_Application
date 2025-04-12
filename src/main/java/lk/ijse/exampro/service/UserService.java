package lk.ijse.exampro.service;

import lk.ijse.exampro.dto.UserDTO;
import lk.ijse.exampro.util.enums.UserRole;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface UserService {
    int saveUser(UserDTO userDTO);
    List<UserDTO> getAllUsers(UserRole authenticatedRole);
    List<UserDTO> getAllAdmins();
    UserDTO searchUser(String username);
    int deleteUserByEmail(String email);
    int updateUserProfile(String email, UserDTO userDTO);
    int deactivateUser(String email);
    UserDTO uploadProfilePicture(String email, MultipartFile file) throws IOException;
}