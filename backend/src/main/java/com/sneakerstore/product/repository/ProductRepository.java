package com.sneakerstore.product.repository;

import com.sneakerstore.product.entity.Product;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            select distinct p
            from Product p
            where lower(p.name) like lower(concat('%', :search, '%'))
               or lower(p.description) like lower(concat('%', :search, '%'))
               or lower(p.brand) like lower(concat('%', :search, '%'))
               or lower(p.model) like lower(concat('%', :search, '%'))
               or lower(p.category) like lower(concat('%', :search, '%'))
            order by p.id
            """)
    List<Product> search(@Param("search") String search);
}
