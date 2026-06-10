package com.sneakerstore.user.service;

import com.sneakerstore.user.dto.UserResponse;
import com.sneakerstore.user.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getCpf(),
                user.getPhone(),
                user.getCep(),
                user.getAddress(),
                user.getNumber(),
                user.getComplement(),
                user.getCity(),
                user.getState()
        );
    }
}
