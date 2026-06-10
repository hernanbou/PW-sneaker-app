package com.sneakerstore.order.repository;

import com.sneakerstore.order.entity.OrderEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrderRepository extends JpaRepository<OrderEntity, Long> {

    boolean existsByOrderNumber(String orderNumber);

    @Query("""
            select distinct o
            from OrderEntity o
            left join fetch o.items i
            left join fetch i.product
            where o.user.id = :userId
            order by o.createdAt desc
            """)
    List<OrderEntity> findAllByUserIdWithItems(@Param("userId") Long userId);

    @Query("""
            select distinct o
            from OrderEntity o
            left join fetch o.items i
            left join fetch i.product
            where o.id = :id and o.user.id = :userId
            """)
    Optional<OrderEntity> findByIdAndUserIdWithItems(@Param("id") Long id, @Param("userId") Long userId);

    @Query("""
            select distinct o
            from OrderEntity o
            left join fetch o.items i
            left join fetch i.product
            where o.orderNumber = :orderNumber and o.user.id = :userId
            """)
    Optional<OrderEntity> findByOrderNumberAndUserIdWithItems(
            @Param("orderNumber") String orderNumber,
            @Param("userId") Long userId
    );
}
