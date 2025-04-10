package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.User;
import lk.ijse.exampro.util.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    @Modifying
    @Query("DELETE FROM User u WHERE u.email = ?1")
    void deleteByEmail(String email);

    List<User> findAllByRole(UserRole role);

    List<User> findAllByRoleNot(UserRole role);

    List<User> findAllByRoleIn(List<UserRole> roles);

}