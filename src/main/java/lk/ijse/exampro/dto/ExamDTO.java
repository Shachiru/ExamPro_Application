package lk.ijse.exampro.dto;

import lk.ijse.exampro.entity.Exam;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ExamDTO {
    private Long id;
    private String title;
    private String subject;
    private int duration;
    private LocalDateTime startTime;
    private String examType;
    private String createdByEmail;
    private String schoolName;

    public ExamDTO(Exam exam) {
        this.id = exam.getId();
        this.title = exam.getTitle();
        this.subject = exam.getSubject();
        this.duration = exam.getDuration();
        this.startTime = exam.getStartTime();
        this.examType = exam.getExamType();
        this.createdByEmail = exam.getCreatedBy() != null ? exam.getCreatedBy().getEmail() : null;
        this.schoolName = exam.getSchoolName();
    }
}