package com.example.AppTesting.models.api;

import com.example.AppTesting.models.enums.AdditionalFlag;
import com.example.AppTesting.models.enums.DishCategory;
import com.fasterxml.jackson.annotation.JsonManagedReference;
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
@Table(name = "dishes")
public class Dish {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String name;
    @ElementCollection
    @CollectionTable(name = "dish_images", joinColumns = @JoinColumn(name = "dish_id"))
    private List<String> imgUrls = new ArrayList<>();
    @Column(nullable = false)
    private float calories;
    @Column(nullable = false)
    private float protein;
    @Column(nullable = false)
    private float fats;
    @Column(nullable = false)
    private float carbs;
    @Column(nullable = false)
    private float portionSize;
    @Enumerated(EnumType.STRING)
    private DishCategory category;
    @ElementCollection
    @CollectionTable(name = "dish_flags", joinColumns = @JoinColumn(name = "dish_id"))
    @Enumerated(EnumType.STRING)
    private Set<AdditionalFlag> flags = new HashSet<>();
    @OneToMany(mappedBy = "dish", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("dish-ingredients")
    private List<DishIngredient> ingredients = new ArrayList<>();
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
