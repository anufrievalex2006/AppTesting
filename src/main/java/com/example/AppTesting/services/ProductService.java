package com.example.AppTesting.services;

import com.example.AppTesting.models.api.Product;
import com.example.AppTesting.models.enums.AdditionalFlag;
import com.example.AppTesting.models.enums.CookingStatus;
import com.example.AppTesting.models.enums.ProductCategory;
import com.example.AppTesting.repos.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@Transactional
public class ProductService {
    private final ProductRepo productRepo;
    private final DishIngredientRepo dishIngredientRepo;
    @Autowired
    public ProductService(ProductRepo productRepo, DishIngredientRepo dishIngredientRepo) {
        this.productRepo = productRepo;
        this.dishIngredientRepo = dishIngredientRepo;
    }
    public List<Product> get(ProductCategory c, CookingStatus status, List<AdditionalFlag> flags, String search, String sortBy) {
        List<Product> res = productRepo.findAll();
        var s = res.stream();

        if (c != null)
            s = s.filter(p -> p.getCategory() == c);
        if (status != null)
            s = s.filter(p -> p.getStatus() == status);
        if (flags != null && !flags.isEmpty())
            s = s.filter(p -> p.getFlags().containsAll(flags));
        if (search != null && !search.isBlank()) {
            String x = search.toLowerCase();
            s = s.filter(p -> p.getName().toLowerCase().contains(x));
        }
        if (sortBy != null) {
            var comp = switch (sortBy) {
                case "calories" -> Comparator.comparing(Product::getCalories);
                case "protein" -> Comparator.comparing(Product::getProtein);
                case "fats" -> Comparator.comparing(Product::getFats);
                case "carbs" -> Comparator.comparing(Product::getCarbs);
                default -> Comparator.comparing(Product::getName);
            };
            s = s.sorted(comp);
        }
        return s.toList();
    }
    public Product getById(Long id) {
        return productRepo.findById(id).orElseThrow();
    }
    public Product create(Product p) {
        if (p.getCalories() < 0)
            throw new IllegalArgumentException("Калории не могут быть отрицательными");
        if (p.getProtein() < 0)
            throw new IllegalArgumentException("Белки не могут быть отрицательными");
        if (p.getFats() < 0)
            throw new IllegalArgumentException("Жиры не могут быть отрицательными");
        if (p.getCarbs() < 0)
            throw new IllegalArgumentException("Углеводы не могут быть отрицательными");
        if (p.getProtein() + p.getFats() + p.getCarbs() > 100) {
            throw new IllegalArgumentException("Сумма БЖУ не может превышать 100 г на 100 г продукта");
        }
        return productRepo.save(p);
    }
    public Product update(Long id, Product p1) {
        Product p = productRepo.findById(id).orElseThrow();
        p.setName(p1.getName());
        p.setCalories(p1.getCalories());
        p.setCarbs(p1.getCarbs());
        p.setFats(p1.getFats());
        p.setFlags(p1.getFlags());
        p.setComposition(p1.getComposition());
        p.setImgUrls(p1.getImgUrls());
        p.setProtein(p1.getProtein());
        p.setStatus(p1.getStatus());
        p.setCategory(p1.getCategory());
        if (p.getCalories() < 0)
            throw new IllegalArgumentException("Калории не могут быть отрицательными");
        if (p.getProtein() < 0)
            throw new IllegalArgumentException("Белки не могут быть отрицательными");
        if (p.getFats() < 0)
            throw new IllegalArgumentException("Жиры не могут быть отрицательными");
        if (p.getCarbs() < 0)
            throw new IllegalArgumentException("Углеводы не могут быть отрицательными");
        if (p.getProtein() + p.getFats() + p.getCarbs() > 100) {
            throw new IllegalArgumentException("Сумма БЖУ не может превышать 100 г на 100 г продукта");
        }
        return productRepo.save(p);
    }
    public void delete(Long id) {
        var used = dishIngredientRepo.findByProductId(id);
        if (!used.isEmpty()) {
            var names = used.stream()
                    .map(i -> i.getDish().getName())
                    .distinct()
                    .toList();
            throw new IllegalStateException("Нельзя удалить этот продукт, поскольку он используется в следующих блюдах: " + names);
        }
        productRepo.deleteById(id);
    }
}
