package com.sneakerstore.order.controller;

import com.sneakerstore.order.dto.OrderResponse;
import com.sneakerstore.order.service.OrderService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/me")
    public List<OrderResponse> listMyOrders() {
        return orderService.listMyOrders();
    }

    @GetMapping("/{id}")
    public OrderResponse getMyOrder(@PathVariable String id) {
        return orderService.getMyOrder(id);
    }
}
