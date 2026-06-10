package com.sneakerstore.order.dto;

import com.sneakerstore.order.enums.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        String id,
        Long userId,
        String customerName,
        String customerEmail,
        String customerPhone,
        List<OrderItemResponse> items,
        OrderAddressResponse address,
        PaymentInfoResponse payment,
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal shipping,
        BigDecimal total,
        OrderStatus status,
        LocalDateTime createdAt
) {
}
