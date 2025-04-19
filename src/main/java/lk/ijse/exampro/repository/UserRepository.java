package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.User;
import lk.ijse.exampro.util.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID>, JpaSpecificationExecutor<User> {
    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    boolean existsByNic(String nic);

    @Modifying
    @Query("DELETE FROM User u WHERE u.email = ?1")
    void deleteByEmail(String email);

    List<User> findAllByRoleNot(UserRole role);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = ?1")
    long countByRole(UserRole role);

}
