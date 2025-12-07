package edu.lms.exception;

public class TutorApplicationException extends RuntimeException {
    public TutorApplicationException(String message) {
        super(message);
    }
    
    public TutorApplicationException(String message, Throwable cause) {
        super(message, cause);
    }
}
