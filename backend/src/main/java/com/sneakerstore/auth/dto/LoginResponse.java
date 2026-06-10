package com.sneakerstore.auth.dto;

import com.sneakerstore.user.dto.UserResponse;

public record LoginResponse(
        String token,
        String tokenType,
        UserResponse user
) {
}
