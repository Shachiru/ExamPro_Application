package lk.ijse.exampro.repository;

import lk.ijse.exampro.entity.Teacher;
import lk.ijse.exampro.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TeacherRepository extends JpaRepository<Teacher, Long> {
    Optional<Teacher> findByUser(User user);

    Optional<Teacher> findByUser_Email(String email);

    List<Teacher> findBySchoolName(String schoolName);

    Page<Teacher> findBySchoolName(String schoolName, Pageable pageable);

    Page<Teacher> findBySchoolNameAndUser_IsActive(String schoolName, boolean isActive, Pageable pageable);

    Page<Teacher> findByUser_IsActive(boolean isActive, Pageable pageable);

    Page<Teacher> findBySchoolNameAndUser_FullNameContainingIgnoreCaseOrSchoolNameAndUser_EmailContainingIgnoreCase(
            String schoolName1, String fullName, String schoolName2, String email, Pageable pageable);

    Page<Teacher> findByUser_FullNameContainingIgnoreCaseOrUser_EmailContainingIgnoreCase(
            String fullName, String email, Pageable pageable);

    long countBySchoolName(String schoolName);

    long countBySchoolNameAndUser_IsActive(String schoolName, boolean isActive);

    long countByUser_IsActive(boolean isActive);

    @Query("SELECT COUNT(t) FROM Teacher t WHERE t.schoolName = :schoolName AND " +
            "(LOWER(t.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(t.user.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
            "(:isActive IS NULL OR t.user.isActive = :isActive)")
    long countBySchoolNameAndSearchAndStatus(
            @Param("schoolName") String schoolName,
            @Param("search") String search,
            @Param("isActive") Boolean isActive);

    @Query("SELECT COUNT(t) FROM Teacher t WHERE " +
            "(LOWER(t.user.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(t.user.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
            "(:isActive IS NULL OR t.user.isActive = :isActive)")
    long countBySearchAndStatus(
            @Param("search") String search,
            @Param("isActive") Boolean isActive);
}