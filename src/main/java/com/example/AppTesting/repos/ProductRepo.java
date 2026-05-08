package com.example.AppTesting.repos;

import com.example.AppTesting.models.api.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepo extends JpaRepository<Product, Long> {}
