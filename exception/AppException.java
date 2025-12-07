package edu.lms.exception;

public class AppException extends RuntimeException {
    public AppException(ErrorCode errorcode) {
        this.errorcode = errorcode;
    }

    private ErrorCode errorcode;

    public ErrorCode getErrorcode() {
        return errorcode;
    }

    public void setErrorcode(ErrorCode errorcode) {
        this.errorcode = errorcode;
    }
}
