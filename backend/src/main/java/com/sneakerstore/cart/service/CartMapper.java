package com.sneakerstore.cart.service;

import com.sneakerstore.cart.dto.CartItemResponse;
import com.sneakerstore.cart.dto.CartResponse;
import com.sneakerstore.cart.entity.Cart;
import com.sneakerstore.cart.entity.CartItem;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class CartMapper {

    public CartResponse toResponse(Cart cart) {
        List<CartItemResponse> items = cart.getItems().stream()
                .map(this::toItemResponse)
                .toList();

        BigDecimal subtotal = items.stream()
                .map(CartItemResponse::lineTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Integer itemCount = items.stream()
                .map(CartItemResponse::quantity)
                .reduce(0, Integer::sum);

        return new CartResponse(cart.getId(), items, itemCount, subtotal);
    }

    private CartItemResponse toItemResponse(CartItem item) {
        BigDecimal lineTotal = item.getProduct().getPrice()
                .multiply(BigDecimal.valueOf(item.getQuantity()));

        return new CartItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProduct().getName(),
                item.getProduct().getImage(),
                item.getProduct().getPrice(),
                item.getSelectedSize(),
                item.getQuantity(),
                lineTotal
        );
    }
}
