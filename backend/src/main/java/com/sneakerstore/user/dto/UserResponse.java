package com.sneakerstore.user.dto;

public record UserResponse(
        Long id,
        String fullName,
        String email,
        String cpf,
        String phone,
        String cep,
        String address,
        String number,
        String complement,
        String city,
        String state
) {
}
