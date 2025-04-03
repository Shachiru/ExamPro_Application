package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.User;
import lk.ijse.exampro.util.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User,String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findAllByRoleNot(UserRole role);

}