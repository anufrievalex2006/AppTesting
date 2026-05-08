package com.example.AppTesting.controllers;

import com.example.AppTesting.models.api.Product;
import com.example.AppTesting.models.enums.AdditionalFlag;
import com.example.AppTesting.models.enums.CookingStatus;
import com.example.AppTesting.models.enums.ProductCategory;
import com.example.AppTesting.services.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {
    private final ProductService service;
    @Autowired
    public ProductController(ProductService service) {
        this.service = service;
    }

    @GetMapping
    public List<Product> get(
            @RequestParam(required = false)ProductCategory category,
            @RequestParam(required = false)CookingStatus status,
            @RequestParam(required = false) List<AdditionalFlag> flags,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String sortBy
            ) {
        return service.get(category, status, flags, search, sortBy);
    }
    @GetMapping("/{id}")
    public Product getById(@PathVariable Long id) {
        return service.getById(id);
    }
    @PostMapping
    public Product create(@RequestBody Product p) {
        return service.create(p);
    }
    @PutMapping("/{id}")
    public Product update(@PathVariable Long id, @RequestBody Product p) {
        return service.update(id, p);
    }
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
