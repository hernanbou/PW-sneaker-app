package com.sneakerstore.order.service;

import com.sneakerstore.order.dto.OrderAddressResponse;
import com.sneakerstore.order.dto.OrderItemResponse;
import com.sneakerstore.order.dto.OrderResponse;
import com.sneakerstore.order.dto.PaymentInfoResponse;
import com.sneakerstore.order.entity.OrderAddress;
import com.sneakerstore.order.entity.OrderEntity;
import com.sneakerstore.order.entity.OrderItem;
import com.sneakerstore.order.entity.PaymentInfo;
import java.time.ZoneOffset;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class OrderMapper {

    public OrderResponse toResponse(OrderEntity order) {
        return new OrderResponse(
                getPublicOrderId(order),
                order.getUser().getId(),
                order.getCustomerName(),
                order.getCustomerEmail(),
                order.getCustomerPhone(),
                order.getItems().stream().map(this::toItemResponse).toList(),
                toAddressResponse(order.getAddress()),
                toPaymentResponse(order.getPayment()),
                order.getSubtotal(),
                order.getDiscount(),
                order.getShipping(),
                order.getTotal(),
                order.getStatus(),
                order.getCreatedAt()
        );
    }

    private OrderItemResponse toItemResponse(OrderItem item) {
        return new OrderItemResponse(
                item.getId(),
                item.getProduct().getId(),
                item.getProductName(),
                item.getProductImage(),
                item.getUnitPrice(),
                item.getSelectedSize(),
                item.getQuantity(),
                item.getLineTotal()
        );
    }

    private OrderAddressResponse toAddressResponse(OrderAddress address) {
        return new OrderAddressResponse(
                address.getCep(),
                address.getAddress(),
                address.getNumber(),
                address.getComplement(),
                address.getCity(),
                address.getState()
        );
    }

    private PaymentInfoResponse toPaymentResponse(PaymentInfo payment) {
        return new PaymentInfoResponse(payment.getMethod(), payment.getInstallments());
    }

    public List<OrderResponse> toResponseList(List<OrderEntity> orders) {
        return orders.stream().map(this::toResponse).toList();
    }

    private String getPublicOrderId(OrderEntity order) {
        if (order.getOrderNumber() != null && !order.getOrderNumber().isBlank()) {
            return order.getOrderNumber();
        }

        long createdAtMillis = order.getCreatedAt()
                .toInstant(ZoneOffset.UTC)
                .toEpochMilli();
        String timePart = Long.toString(createdAtMillis, 36).toUpperCase();
        long fallbackNumber = order.getId() == null ? 0L : Math.abs(order.getId() % 9000L);
        String randomPart = String.valueOf(fallbackNumber + 1000L);

        return "SNK-" + timePart + "-" + randomPart;
    }
}
