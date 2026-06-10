package com.sneakerstore.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Informe o e-mail.")
        @Email(message = "Informe um e-mail valido.")
        String email,

        @NotBlank(message = "Informe a senha.")
        String password
) {
}
