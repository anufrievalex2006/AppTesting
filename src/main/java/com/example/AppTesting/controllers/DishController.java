package com.example.AppTesting.controllers;

import com.example.AppTesting.dtos.requests.DishDto;
import com.example.AppTesting.models.api.Dish;
import com.example.AppTesting.models.enums.AdditionalFlag;
import com.example.AppTesting.models.enums.DishCategory;
import com.example.AppTesting.services.DishService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dishes")
public class DishController {
    private final DishService service;
    @Autowired
    public DishController(DishService service) {
        this.service = service;
    }

    @GetMapping
    public List<Dish> get(
            @RequestParam(required = false)DishCategory category,
            @RequestParam(required = false)List<AdditionalFlag> flags,
            @RequestParam(required = false)String search
            ) {
        return service.get(category, flags, search);
    }
    @GetMapping("/{id}")
    public Dish getById(@PathVariable Long id) {
        return service.getById(id);
    }
    @PostMapping
    public Dish create(@RequestBody DishDto d) {
        return service.create(d);
    }
    @PutMapping("/{id}")
    public Dish update(@PathVariable Long id, @RequestBody DishDto d) {
        return service.update(id, d);
    }
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
