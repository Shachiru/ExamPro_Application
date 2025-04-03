package lk.ijse.exampro.service;

import lk.ijse.exampro.dto.UserDTO;
import lk.ijse.exampro.util.enums.UserRole;

import java.util.List;

public interface UserService {
    int saveUser(UserDTO userDTO);
    List<UserDTO> getAllUsers(UserRole authenticatedRole);
    UserDTO searchUser(String username);
    int deleteUserByEmail(String email);
    int updateUserProfile(String email, UserDTO userDTO);
    int deactivateUser(String email);
}