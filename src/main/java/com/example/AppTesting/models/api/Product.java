package com.example.AppTesting.models.api;

import com.example.AppTesting.models.enums.AdditionalFlag;
import com.example.AppTesting.models.enums.ProductCategory;
import com.example.AppTesting.models.enums.CookingStatus;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    @ElementCollection
    @CollectionTable(name = "product_images", joinColumns = @JoinColumn(name = "product_id"))
    private List<String> imgUrls = new ArrayList<>();
    @Column(nullable = false)
    private float calories;
    @Column(nullable = false)
    private float protein;
    @Column(nullable = false)
    private float fats;
    @Column(nullable = false)
    private float carbs;
    private String composition;
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private ProductCategory category;
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private CookingStatus status;
    @ElementCollection
    @CollectionTable(name = "product_flags", joinColumns = @JoinColumn(name = "product_id"))
    @Enumerated(EnumType.STRING)
    private Set<AdditionalFlag> flags = new HashSet<>();
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}