package lk.ijse.exampro.exeption;

public class ExamSubmissionException extends RuntimeException {
    public ExamSubmissionException(String message) {
        super(message);
    }

    public ExamSubmissionException(String message, Throwable cause) {
        super(message, cause);
    }
}
