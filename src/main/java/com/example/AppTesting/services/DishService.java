package com.example.AppTesting.services;

import com.example.AppTesting.dtos.requests.DishDto;
import com.example.AppTesting.dtos.requests.DishIngredientDto;
import com.example.AppTesting.dtos.responses.NutritionInfoResponse;
import com.example.AppTesting.models.api.Dish;
import com.example.AppTesting.models.api.DishIngredient;
import com.example.AppTesting.models.api.Product;
import com.example.AppTesting.models.enums.AdditionalFlag;
import com.example.AppTesting.models.enums.DishCategory;
import com.example.AppTesting.repos.DishRepo;
import com.example.AppTesting.repos.ProductRepo;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
@Transactional
public class DishService {
    private final DishRepo dishRepo;
    private final ProductRepo productRepo;
    @Autowired
    public DishService(DishRepo dishRepo, ProductRepo productRepo) {
        this.dishRepo = dishRepo;
        this.productRepo = productRepo;
    }

    public List<Dish> get(DishCategory category, List<AdditionalFlag> flags, String search) {
        List<Dish> res = dishRepo.findAll();
        var s = res.stream();

        if (category != null)
            s = s.filter(d -> d.getCategory() == category);
        if (flags != null && !flags.isEmpty())
            s = s.filter(d -> d.getFlags().containsAll(flags));
        if (search != null && !search.isBlank()) {
            String term = search.toLowerCase();
            s = s.filter(d -> d.getName().toLowerCase().contains(term));
        }
        return s.toList();
    }
    public Dish getById(Long id) {
        return dishRepo.findById(id).orElseThrow();
    }
    public Dish create(DishDto req) {
        NameProcessingResult processed = processName(req.getName(), req.getCategory());

        Dish d = new Dish();
        d.setName(processed.cleanedName);
        d.setImgUrls(req.getImgUrls() != null ? new ArrayList<>(req.getImgUrls()) : new ArrayList<>());
        d.setCalories(req.getCalories());
        d.setProtein(req.getProtein());
        d.setFats(req.getFats());
        d.setCarbs(req.getCarbs());
        d.setPortionSize(req.getPortionSize());
        d.setCategory(processed.category);

        if (req.getIngredients() == null || req.getIngredients().isEmpty())
            throw new IllegalArgumentException("Добавьте хотя бы один ингредиент");
        List<DishIngredient> ingrs = new ArrayList<>();
        for (DishIngredientDto i: req.getIngredients()) {
            Product p = productRepo.findById(i.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Продукт с id " + i.getProductId() + " не найден"));
            if (i.getQuantity() < 0)
                throw new IllegalArgumentException("Количество ингредиента не может быть отрицательным");
            DishIngredient di = new DishIngredient();
            di.setProduct(p);
            di.setQuantity(i.getQuantity());
            di.setDish(d);
            ingrs.add(di);
        }
        d.setIngredients(ingrs);

        NutritionInfoResponse calc = calculateNutrition(ingrs);
        if (req.getCalories() == 0 && req.getProtein() == 0 && req.getFats() == 0 && req.getCarbs() == 0) {
            d.setCalories(calc.getCalories());
            d.setProtein(calc.getProtein());
            d.setFats(calc.getFats());
            d.setCarbs(calc.getCarbs());
        }
        else {
            d.setCalories(req.getCalories());
            d.setProtein(req.getProtein());
            d.setFats(req.getFats());
            d.setCarbs(req.getCarbs());
        }

        Set<AdditionalFlag> allowed = computeAllowedFlags(ingrs);
        Set<AdditionalFlag> res = req.getFlags() != null ? new HashSet<>(req.getFlags()) : new HashSet<>();
        res.retainAll(allowed);
        d.setFlags(res);
        return dishRepo.save(d);
    }
    public Dish update(Long id, DishDto req) {
        NameProcessingResult processed = processName(req.getName(), req.getCategory());
        Dish d = dishRepo.findById(id).orElseThrow();
        d.setName(processed.cleanedName);
        d.setImgUrls(req.getImgUrls() != null ? new ArrayList<>(req.getImgUrls()) : new ArrayList<>());
        d.setCalories(req.getCalories());
        d.setProtein(req.getProtein());
        d.setFats(req.getFats());
        d.setCarbs(req.getCarbs());
        d.setPortionSize(req.getPortionSize());
        d.setCategory(processed.category);

        d.getIngredients().clear();
        if (req.getIngredients() == null || req.getIngredients().isEmpty())
            throw new IllegalArgumentException("Добавьте хотя бы один ингредиент");
        for (DishIngredientDto i: req.getIngredients()) {
            Product p = productRepo.findById(i.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Продукт с id " + i.getProductId() + " не найден"));
            if (i.getQuantity() < 0)
                throw new IllegalArgumentException("Количество ингредиента не может быть отрицательным");
            DishIngredient di = new DishIngredient();
            di.setProduct(p);
            di.setQuantity(i.getQuantity());
            di.setDish(d);
            d.getIngredients().add(di);
        }

        NutritionInfoResponse calc = calculateNutrition(d.getIngredients());
        if (req.getCalories() == 0 && req.getProtein() == 0 && req.getFats() == 0 && req.getCarbs() == 0) {
            d.setCalories(calc.getCalories());
            d.setProtein(calc.getProtein());
            d.setFats(calc.getFats());
            d.setCarbs(calc.getCarbs());
        }
        else {
            d.setCalories(req.getCalories());
            d.setProtein(req.getProtein());
            d.setFats(req.getFats());
            d.setCarbs(req.getCarbs());
        }

        Set<AdditionalFlag> allowed = computeAllowedFlags(d.getIngredients());
        Set<AdditionalFlag> res = req.getFlags() != null ? new HashSet<>(req.getFlags()) : new HashSet<>();
        res.retainAll(allowed);
        d.setFlags(res);
        return dishRepo.save(d);
    }
    public void delete(Long id) {
        dishRepo.deleteById(id);
    }
    public NutritionInfoResponse calculateNutrition(List<DishIngredient> ingrs) {
        float cals = 0, protein = 0, fats = 0, carbs = 0;
        for (DishIngredient di: ingrs) {
            if (di.getQuantity() < 0)
                throw new IllegalArgumentException("Количество ингредиента не может быть отрицательным");
            Product p = di.getProduct();
            if (p == null) continue;

            float f = di.getQuantity() / 100f;
            cals += p.getCalories() * f;
            protein += p.getProtein() * f;
            fats += p.getFats() * f;
            carbs += p.getCarbs() * f;
        }
        return new NutritionInfoResponse(cals, protein, fats, carbs);
    }
    private NameProcessingResult processName(String raw, DishCategory categ) {
        String cleaned = raw;
        DishCategory macro = null;
        String[] macros = {"!десерт","!первое","!второе","!напиток","!салат","!суп","!перекус"};
        DishCategory[] categs = {DishCategory.DESSERT,DishCategory.FIRST,DishCategory.SECOND,DishCategory.DRINK,DishCategory.SALAD,DishCategory.SOUP,DishCategory.SNACK};

        int p0 = Integer.MAX_VALUE, x = -1;
        for (int i = 0; i < macros.length; i++) {
            int p = raw.indexOf(macros[i]);
            if (p != -1 && p < p0) {
                p0 = p;
                x = i;
            }
        }
        if (x != -1) {
            String m = macros[x];
            cleaned = raw.substring(0, p0) + raw.substring(p0 + m.length());
            macro = categs[x];
        }
        DishCategory res = categ != null ? categ : macro;
        if (res == null)
            throw new IllegalArgumentException("Нужна категория блюда");
        return new NameProcessingResult(cleaned.trim(), res);
    }
    private Set<AdditionalFlag> computeAllowedFlags(List<DishIngredient> ingrs) {
        if (ingrs.isEmpty())
            return Set.of();
        Set<AdditionalFlag> allowed = new HashSet<>(Arrays.asList(AdditionalFlag.values()));
        for (AdditionalFlag f: AdditionalFlag.values()) {
            boolean all = ingrs.stream()
                    .allMatch(i -> i.getProduct().getFlags().contains(f));
            if (!all)
                allowed.remove(f);
        }
        return allowed;
    }
    private record NameProcessingResult(String cleanedName, DishCategory category) {}
}
