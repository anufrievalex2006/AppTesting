import { z } from "zod"
import type { Dish } from "../models/dish";
import { useCreateDish, useUpdateDish } from "../hooks/useDishes";
import { useProducts } from "../hooks/useProducts";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import { ActionIcon, Button, Group, MultiSelect, NumberInput, Select, Stack, Text, TextInput } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";

const schema = z.object({
    name: z.string().min(2, "Название должно быть минимум 2 символа"),
    imgUrls: z.array(z.string()).max(5, "Максимум 5 фото"),
    calories: z.number().min(0),
    protein: z.number().min(0),
    fats: z.number().min(0),
    carbs: z.number().min(0),
    portionSize: z.number().min(1, "Порция должна быть больше 0"),
    category: z.enum(["DESSERT", "FIRST", "SECOND", "DRINK", "SALAD", "SOUP", "SNACK"]).optional(),
    flags: z.array(z.enum(["VEGAN", "NO_GLUTEN", "NO_SUGAR"])),
    ingredients: z.array(
        z.object({
        productId: z.number().min(1),
        quantity: z.number().min(0.1),
        })
    ).min(1, "Добавьте хотя бы один продукт"),
});
type DishFormValues = z.infer<typeof schema>;

interface Props {
    dish?: Dish | null;
    opened: boolean;
    onClose: () => void;
}

const macros = [
    { key: "!десерт", value: "DESSERT" as const, label: "Десерт" },
    { key: "!первое", value: "FIRST" as const, label: "Первое" },
    { key: "!второе", value: "SECOND" as const, label: "Второе" },
    { key: "!напиток", value: "DRINK" as const, label: "Напиток" },
    { key: "!салат", value: "SALAD" as const, label: "Салат" },
    { key: "!суп", value: "SOUP" as const, label: "Суп" },
    { key: "!перекус", value: "SNACK" as const, label: "Перекус" },
];

export const DishForm = ({dish, opened, onClose}: Props) => {
    const isEdit = !!dish;
    const [newImgUrl, setNewImgUrl] = useState("");
    const create = useCreateDish(), update = useUpdateDish();
    const {data: prods = []} = useProducts({});
    const form = useForm<DishFormValues>({
        defaultValues: dish ? {
            name: dish.name,
            imgUrls: dish.imgUrls,
            calories: dish.calories,
            protein: dish.protein,
            fats: dish.fats,
            carbs: dish.carbs,
            portionSize: dish.portionSize,
            category: dish.category,
            flags: dish.flags,
            ingredients: dish.ingredients.map((i) => ({
                productId: i.product.id,
                quantity: i.quantity,
            })),
        } : {
            name: "",
            imgUrls: [],
            calories: 0,
            protein: 0,
            fats: 0,
            carbs: 0,
            portionSize: 300,
            category: undefined,
            flags: [],
            ingredients: [],
        },
        resolver: zodResolver(schema)
    });
    const {fields, append, remove} = useFieldArray({
        control: form.control,
        name: "ingredients"
    });
    const getCPFC = () => {
        // Получаю КБЖУ
        let cal = 0, p = 0, f = 0, c = 0;
        form.getValues("ingredients").forEach(i => {
            const prod = prods.find(p => p.id === i.productId);
            if (prod) {
                const fac = i.quantity / 100;
                cal += prod.calories * fac;
                p += prod.protein * fac;
                f += prod.fats * fac;
                c += prod.carbs * fac;
            }
        });
        form.setValue("calories", Math.round(cal * 10) / 10);
        form.setValue("protein", Math.round(p * 10) / 10);
        form.setValue("fats", Math.round(f * 10) / 10);
        form.setValue("carbs", Math.round(c * 10) / 10);
    };
    const ingredients = form.watch('ingredients');
    const fname = form.watch("name");
    useEffect(() => {
        if (!opened) return;

        let name = form.getValues("name");
        let detectedCateg: DishFormValues["category"] | undefined = undefined;
        for (const m of macros) {
            if (name.includes(m.key)) {
                name = name.replace(m.key, "").trim();
                detectedCateg = m.value;
                break;
            }
        }
        if (detectedCateg && !form.getValues("category"))
            form.setValue("category", detectedCateg);

        const curIngrs = form.getValues("ingredients");
        const allowed: ("VEGAN" | "NO_GLUTEN" | "NO_SUGAR")[] = [];
        ["VEGAN", "NO_GLUTEN", "NO_SUGAR"].forEach(x => {
            const allHave = curIngrs.every(i => {
                const prod = prods.find(p => p.id === i.productId);
                return prod?.flags.includes(x as any);
            });
            if (allHave)
                allowed.push(x as any);
        });
        const flags = form.getValues("flags");
        const validFlags = flags.filter(f => allowed.includes(f));
        if (validFlags.length !== flags.length)
            form.setValue("flags", validFlags);
    }, [ingredients, fname, prods, opened]);
    const onSubmit = async (data: DishFormValues) => {
        try {
            if (isEdit && dish) {
                await update.mutateAsync({ id: dish.id, ...data });
                notifications.show({
                    title: "Успех",
                    message: "Блюдо обновлено",
                    color: "green"
                });
            }
            else {
                await create.mutateAsync(data);
                notifications.show({
                    title: "Успех",
                    message: "Блюдо создано",
                    color: "green"
                });
            }
            onClose();
            form.reset();
        }
        catch (e: any) {
            notifications.show({
                title: "Ошибка",
                message: e.response?.data?.message || "Не удалось сохранить блюдо",
                color: "red",
            });
        }
    };
    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <Stack gap="md">
                <Controller name="imgUrls" control={form.control} render={() => <></>}></Controller>
                <TextInput label="Название блюда (можно !десерт, !суп и т.д.)" {...form.register("name")} error={form.formState.errors.name?.message}></TextInput>
                <Stack>
                    <TextInput label="Добавить URL изображения (для добавления в список нажмите Enter!)" value={newImgUrl} onChange={
                        (e) => setNewImgUrl(e.target.value)
                    } onKeyDown={
                        (e) => {
                            if (e.key === "Enter" && newImgUrl.trim()) {
                                e.preventDefault();
                                const cur = form.getValues("imgUrls") || [];
                                if (cur.length >= 5) {
                                    notifications.show({
                                        title: "Ошибка",
                                        message: "Максимум 5 фото",
                                        color: "red"
                                    });
                                    return;
                                }
                                form.setValue("imgUrls", [...cur, newImgUrl.trim()]);
                                setNewImgUrl("");
                            }
                        }
                    }></TextInput>
                    {form.watch("imgUrls").map((url: string, i: number) => (
                        <Group key={`img-${url}-${i}`}>
                            <Text size="sm" flex={1}>{url}</Text>
                            <ActionIcon color="red" onClick={
                                () => {
                                    const urls = form.getValues("imgUrls") || [];
                                    form.setValue("imgUrls", urls.filter((_, id) => id !== i));
                                }
                            }>
                                <IconTrash size={16}></IconTrash>
                            </ActionIcon>
                        </Group>
                    ))}
                </Stack>
                <Group grow>
                    <Controller control={form.control} name="portionSize" render={({field}) => (
                        <NumberInput label="Размер порции (г)" value={field.value} onChange={
                            (x) => {
                                field.onChange(x === "" ? 300 : x);
                                getCPFC();
                            }
                        }></NumberInput>
                    )}></Controller>
                    <Controller control={form.control} name="category" render={({field}) => (
                        <Select label="Категория" clearable data={macros.map((m) => ({
                            value: m.value,
                            label: m.label
                        }))} value={field.value ?? null} placeholder="Авто из названия" onChange={
                            (x) => field.onChange(x ?? undefined)
                        }></Select>
                    )}></Controller>
                </Group>
                {form.formState.errors.root && (
                    <Text c="red">{form.formState.errors.root.message}</Text>
                )}
                <Stack>
                    <Text fw={500}>Состав блюда</Text>
                    {fields.map((f,i) => (
                        <Group key={f.id} grow align="end">
                            <Controller name={`ingredients.${i}.productId`} control={form.control} render={({ field: f }) => (
                                <Select label="Продукт" data={prods.map((p) => ({
                                    value: String(p.id),
                                    label: p.name
                                }))} value={String(f.value)} onChange={(val) => {
                                    f.onChange(Number(val));
                                    getCPFC();
                                }}></Select>
                            )}></Controller>
                            <Controller name={`ingredients.${i}.quantity`} control={form.control} render={({ field }) => (
                                <NumberInput label="Количество (г)" value={field.value} onChange={(val) => {
                                    field.onChange(val === "" ? 100 : val);
                                    getCPFC();
                                }}></NumberInput>
                            )}></Controller>
                            <ActionIcon color="red" onClick={() => {
                                remove(i);
                                getCPFC();
                            }}>
                                <IconTrash size={18}></IconTrash>
                            </ActionIcon>
                        </Group>
                    ))}
                    {form.formState.errors.ingredients?.root?.message && (
                        <Text c="red">{form.formState.errors.ingredients.root.message}</Text>
                    )}
                    <Button variant="light" leftSection={<IconPlus size={16}></IconPlus>} onClick={() => append({
                        productId: 0,
                        quantity: 100
                    })}>Добавить продукт</Button>
                </Stack>
                <Group grow>
                    <Controller name="calories" control={form.control} render={({ field }) => (
                        <NumberInput label="Калории (ккал/порция)" value={field.value} onChange={field.onChange}></NumberInput>
                    )}></Controller>
                    <Controller name="protein" control={form.control} render={({ field }) => (
                        <NumberInput label="Белки (г/порция)" value={field.value} onChange={field.onChange}></NumberInput>
                    )}></Controller>
                    <Controller name="fats" control={form.control} render={({ field }) => (
                        <NumberInput label="Жиры (г/порция)" value={field.value} onChange={field.onChange}></NumberInput>
                    )}></Controller>
                    <Controller name="carbs" control={form.control} render={({ field }) => (
                        <NumberInput label="Углеводы (г/порция)" value={field.value} onChange={field.onChange}></NumberInput>
                    )}></Controller>
                </Group>
                <Button variant="outline" onClick={getCPFC}>Пересчитать КБЖУ</Button>
                <Controller name="flags" control={form.control} render={({ field }) => {  
                    // Вычисляем допустимые флаги прямо здесь на основе текущего состава
                    const curIngrs = form.getValues("ingredients");
                    const allowedFlags: ("VEGAN" | "NO_GLUTEN" | "NO_SUGAR")[] = [];
                    ["VEGAN", "NO_GLUTEN", "NO_SUGAR"].forEach(x => {
                    const allHave = curIngrs.every(i => {
                        const prod = prods.find(p => p.id === i.productId);
                        return prod?.flags.includes(x as any);
                    });
                    if (allHave) allowedFlags.push(x as any);
                    });

                    const flagOptions = [
                    { value: "VEGAN", label: "Веган" },
                    { value: "NO_GLUTEN", label: "Без глютена" },
                    { value: "NO_SUGAR", label: "Без сахара" },
                    ].filter(opt => allowedFlags.includes(opt.value as any));

                    // Снимаем недопустимые флаги, которые могли остаться в field.value
                    const validFlags = field.value.filter(f => allowedFlags.includes(f));
                    if (validFlags.length !== field.value.length) {
                    // обновляем значение через onChange, чтобы избежать лишних ререндеров
                    field.onChange(validFlags);
                    }

                    return (
                    <MultiSelect
                        label="Дополнительные флаги (автоматически фильтруются)"
                        data={flagOptions}
                        value={field.value}
                        onChange={field.onChange}
                    />
                    );               
                }}></Controller>
                <Group justify="flex-end" mt="md">
                    <Button variant="light" onClick={onClose}>
                        Отмена
                    </Button>
                    <Button type="submit" loading={create.isPending || update.isPending}>
                        {isEdit ? "Сохранить изменения" : "Создать блюдо"}
                    </Button>
                </Group>
            </Stack>
        </form>
    )
}