package com.sneakerstore.order.dto;

public record OrderAddressResponse(
        String cep,
        String address,
        String number,
        String complement,
        String city,
        String state
) {
}
