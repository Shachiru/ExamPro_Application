package lk.ijse.exampro.dto;

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
}