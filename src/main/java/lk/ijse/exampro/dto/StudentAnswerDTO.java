package lk.ijse.exampro.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StudentAnswerDTO {
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private Long questionId;
    private String questionContent;
    private String studentAnswer;
    private String correctAnswer;
    private Integer answerScore;
    private Integer totalScore;
    private Boolean isCompleted;
    private String subject;
}
