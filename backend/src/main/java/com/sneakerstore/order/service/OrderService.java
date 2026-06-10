package com.sneakerstore.order.service;

import com.sneakerstore.cart.entity.Cart;
import com.sneakerstore.cart.entity.CartItem;
import com.sneakerstore.cart.repository.CartRepository;
import com.sneakerstore.exception.BadRequestException;
import com.sneakerstore.exception.NotFoundException;
import com.sneakerstore.order.dto.CheckoutRequest;
import com.sneakerstore.order.dto.OrderResponse;
import com.sneakerstore.order.entity.OrderAddress;
import com.sneakerstore.order.entity.OrderEntity;
import com.sneakerstore.order.entity.OrderItem;
import com.sneakerstore.order.entity.PaymentInfo;
import com.sneakerstore.order.enums.OrderStatus;
import com.sneakerstore.order.enums.PaymentMethod;
import com.sneakerstore.order.repository.OrderRepository;
import com.sneakerstore.security.CurrentUserProvider;
import com.sneakerstore.user.entity.User;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrderService {

    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("600.00");
    private static final BigDecimal DEFAULT_SHIPPING = new BigDecimal("29.90");

    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CurrentUserProvider currentUserProvider;
    private final OrderMapper orderMapper;

    public OrderService(
            OrderRepository orderRepository,
            CartRepository cartRepository,
            CurrentUserProvider currentUserProvider,
            OrderMapper orderMapper
    ) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.currentUserProvider = currentUserProvider;
        this.orderMapper = orderMapper;
    }

    @Transactional
    public OrderResponse checkout(CheckoutRequest request) {
        User user = currentUserProvider.getCurrentUser();
        Cart cart = cartRepository.findByUserIdWithItems(user.getId())
                .orElseThrow(() -> new NotFoundException("Carrinho nao encontrado."));

        if (cart.getItems().isEmpty()) {
            throw new BadRequestException("Carrinho vazio. Adicione itens antes de finalizar o pedido.");
        }

        validatePayment(request.paymentMethod(), request.installments());

        BigDecimal subtotal = calculateSubtotal(cart);
        BigDecimal discount = calculateDiscount(subtotal, request.paymentMethod(), request.installments());
        BigDecimal shipping = calculateShipping(subtotal);
        BigDecimal total = subtotal.subtract(discount).add(shipping).setScale(2, RoundingMode.HALF_UP);

        OrderEntity order = new OrderEntity();
        order.setOrderNumber(generateUniqueOrderNumber());
        order.setUser(user);
        order.setCustomerName(valueOrDefault(request.fullName(), user.getFullName()));
        order.setCustomerEmail(valueOrDefault(request.email(), user.getEmail()).toLowerCase());
        order.setCustomerPhone(onlyDigits(valueOrDefault(request.phone(), user.getPhone())));
        order.setAddress(createAddress(user, request));
        order.setPayment(createPayment(request));
        order.setSubtotal(subtotal);
        order.setDiscount(discount);
        order.setShipping(shipping);
        order.setTotal(total);
        order.setStatus(OrderStatus.RECEBIDO);
        order.setCreatedAt(LocalDateTime.now());

        for (CartItem cartItem : cart.getItems()) {
            order.addItem(createOrderItem(cartItem));
        }

        OrderEntity savedOrder = orderRepository.save(order);
        cart.clearItems();

        return orderMapper.toResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> listMyOrders() {
        User user = currentUserProvider.getCurrentUser();
        return orderMapper.toResponseList(orderRepository.findAllByUserIdWithItems(user.getId()));
    }

    @Transactional(readOnly = true)
    public OrderResponse getMyOrder(String id) {
        User user = currentUserProvider.getCurrentUser();
        OrderEntity order = findOrderByPublicOrDatabaseId(id, user.getId());
        return orderMapper.toResponse(order);
    }

    private BigDecimal calculateSubtotal(Cart cart) {
        return cart.getItems().stream()
                .map(item -> item.getProduct().getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateShipping(BigDecimal subtotal) {
        if (subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }

        return DEFAULT_SHIPPING;
    }

    private BigDecimal calculateDiscount(BigDecimal subtotal, PaymentMethod paymentMethod, Integer installments) {
        BigDecimal percentage = switch (paymentMethod) {
            case PIX -> new BigDecimal("0.15");
            case BOLETO -> new BigDecimal("0.10");
            case CREDIT_CARD -> installments <= 3 ? new BigDecimal("0.05") : BigDecimal.ZERO;
        };

        return subtotal.multiply(percentage).setScale(2, RoundingMode.HALF_UP);
    }

    private void validatePayment(PaymentMethod paymentMethod, Integer installments) {
        if ((paymentMethod == PaymentMethod.PIX || paymentMethod == PaymentMethod.BOLETO) && installments != 1) {
            throw new BadRequestException("Pix e boleto devem ser pagos a vista.");
        }

        if (paymentMethod == PaymentMethod.CREDIT_CARD && (installments < 1 || installments > 10)) {
            throw new BadRequestException("Cartao de credito permite de 1 a 10 parcelas.");
        }
    }

    private OrderAddress createAddress(User user, CheckoutRequest request) {
        OrderAddress address = new OrderAddress();
        address.setCep(onlyDigits(valueOrDefault(request.cep(), user.getCep())));
        address.setAddress(valueOrDefault(request.address(), user.getAddress()));
        address.setNumber(valueOrDefault(request.number(), user.getNumber()));
        address.setComplement(valueOrDefault(request.complement(), user.getComplement()));
        address.setCity(valueOrDefault(request.city(), user.getCity()));
        address.setState(valueOrDefault(request.state(), user.getState()).toUpperCase());
        return address;
    }

    private String valueOrDefault(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback == null ? "" : fallback.trim();
        }

        return value.trim();
    }

    private String onlyDigits(String value) {
        return value.replaceAll("\\D", "");
    }

    private PaymentInfo createPayment(CheckoutRequest request) {
        PaymentInfo payment = new PaymentInfo();
        payment.setMethod(request.paymentMethod());
        payment.setInstallments(request.paymentMethod() == PaymentMethod.CREDIT_CARD ? request.installments() : 1);
        return payment;
    }

    private OrderItem createOrderItem(CartItem cartItem) {
        BigDecimal unitPrice = cartItem.getProduct().getPrice();
        Integer quantity = cartItem.getQuantity();

        OrderItem item = new OrderItem();
        item.setProduct(cartItem.getProduct());
        item.setProductName(cartItem.getProduct().getName());
        item.setProductImage(cartItem.getProduct().getImage());
        item.setUnitPrice(unitPrice);
        item.setSelectedSize(cartItem.getSelectedSize());
        item.setQuantity(quantity);
        item.setLineTotal(unitPrice.multiply(BigDecimal.valueOf(quantity)).setScale(2, RoundingMode.HALF_UP));
        return item;
    }

    private OrderEntity findOrderByPublicOrDatabaseId(String id, Long userId) {
        if (id != null && id.startsWith("SNK-")) {
            return orderRepository.findByOrderNumberAndUserIdWithItems(id, userId)
                    .orElseThrow(() -> new NotFoundException("Pedido nao encontrado."));
        }

        try {
            Long databaseId = Long.valueOf(id);
            return orderRepository.findByIdAndUserIdWithItems(databaseId, userId)
                    .orElseThrow(() -> new NotFoundException("Pedido nao encontrado."));
        } catch (NumberFormatException exception) {
            throw new NotFoundException("Pedido nao encontrado.");
        }
    }

    private String generateUniqueOrderNumber() {
        for (int attempt = 0; attempt < 5; attempt++) {
            String orderNumber = generateOrderNumber();

            if (!orderRepository.existsByOrderNumber(orderNumber)) {
                return orderNumber;
            }
        }

        return generateOrderNumber();
    }

    private String generateOrderNumber() {
        String timePart = Long.toString(System.currentTimeMillis(), 36).toUpperCase();
        int randomPart = ThreadLocalRandom.current().nextInt(1000, 10000);
        return "SNK-" + timePart + "-" + randomPart;
    }
}
