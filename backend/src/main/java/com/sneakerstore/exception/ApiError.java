package com.sneakerstore.exception;

import java.time.LocalDateTime;
import java.util.Map;

public record ApiError(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> fields
) {

    public static ApiError simple(int status, String error, String message, String path) {
        return new ApiError(LocalDateTime.now(), status, error, message, path, null);
    }

    public static ApiError validation(String message, String path, Map<String, String> fields) {
        return new ApiError(LocalDateTime.now(), 400, "VALIDATION_ERROR", message, path, fields);
    }
}
