package lk.ijse.exampro.service;

import lk.ijse.exampro.dto.UserDTO;

import java.util.List;

public interface UserService {
    int saveUser(UserDTO userDTO);
    List<UserDTO> getAllUsers();
    UserDTO searchUser(String username);
    int deleteUserByEmail(String email);
    int updateUserProfile(String email, UserDTO userDTO);
    int deactivateUser(String email);
}