package com.sneakerstore.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Informe o nome completo.")
        @Size(min = 5, message = "Digite pelo menos 5 caracteres.")
        String fullName,

        @NotBlank(message = "Informe o e-mail.")
        @Email(message = "Informe um e-mail valido.")
        String email,

        @NotBlank(message = "Informe a senha.")
        @Size(min = 6, message = "A senha deve ter pelo menos 6 caracteres.")
        String password,

        @NotBlank(message = "Informe o CPF.")
        @Pattern(regexp = "^\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}$", message = "Informe um CPF valido.")
        String cpf,

        @NotBlank(message = "Informe o celular.")
        @Pattern(regexp = "^\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$", message = "Informe um celular valido.")
        String phone,

        @NotBlank(message = "Informe o CEP.")
        @Pattern(regexp = "^\\d{5}-?\\d{3}$", message = "Informe um CEP valido.")
        String cep,

        @NotBlank(message = "Informe o endereco.")
        String address,

        @NotBlank(message = "Informe o numero.")
        String number,

        String complement,

        @NotBlank(message = "Informe a cidade.")
        String city,

        @NotBlank(message = "Informe a UF.")
        @Pattern(regexp = "^[A-Za-z]{2}$", message = "Use 2 letras.")
        String state
) {
}
