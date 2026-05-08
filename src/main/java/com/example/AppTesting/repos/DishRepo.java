package com.example.AppTesting.repos;

import com.example.AppTesting.models.api.Dish;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DishRepo extends JpaRepository<Dish, Long> {}
