import { z } from "zod";
import type { Product } from "../models/product";
import { useCreateProduct, useUpdateProduct } from "../hooks/useProducts";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { notifications } from "@mantine/notifications";
import { ActionIcon, Button, Group, MultiSelect, NumberInput, Select, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { useState } from "react";
import { IconTrash } from "@tabler/icons-react";

const schema = z.object({
    name: z.string().min(2, "В названии должно быть как минимум 2 символа"),
    imgUrls: z.array(z.string()).max(5, "Максимум 5 фото"),
    calories: z.number().min(0, "Калории могут быть только положительным числом"),
    protein: z.number().min(0, "Белки могут быть только положительным числом"),
    fats: z.number().min(0, "Жиры могут быть только положительным числом"),
    carbs: z.number().min(0, "Углеводы могут быть только положительным числом"),
    composition: z.string(),
    category: z.enum([
        "FROZEN", "MEAT", "VEGETABLES", "HERBS", "SPICES", "CEREALS", "CANNED_GOODS", "LIQUIDS", "SWEETS"
    ]),
    status: z.enum([
        "READY", "SEMI_FINISHED", "NOT_DONE"
    ]),
    flags: z.array(z.enum([
        "VEGAN", "NO_GLUTEN", "NO_SUGAR"
    ]))
}).refine((x) => x.protein + x.fats + x.carbs <= 100, {
    error: "Сумма БЖУ не может быть больше 100 г на 100 г продукта",
    path: ["protein"]
});
type ProductFormValues = z.infer<typeof schema>;

interface Props {
    product?: Product | null;
    onClose: () => void;
}

export const ProductForm = ({product, onClose}: Props) => {
    const isEdit = !!product;
    const [newImgUrl, setNewImgUrl] = useState("");
    const create = useCreateProduct(), update = useUpdateProduct();
    const form = useForm<ProductFormValues>({
        mode: "onChange",
        defaultValues: product ? {
            name: product.name,
            imgUrls: product.imgUrls,
            calories: product.calories,
            protein: product.protein,
            fats: product.fats,
            carbs: product.carbs,
            composition: product.composition ?? "",
            category: product.category,
            status: product.status,
            flags: product.flags
        } : {
            name: "",
            imgUrls: [],
            calories: 0,
            protein: 0,
            fats: 0,
            carbs: 0,
            composition: "",
            category: "VEGETABLES",
            status: "READY",
            flags: []
        },
        resolver: zodResolver(schema)
    });
    const onSubmit = async (data: ProductFormValues) => {
        try {
            if (isEdit && product) {
                await update.mutateAsync({
                    id: product.id,
                    ...data,
                    createdAt: product.createdAt
                });
                notifications.show({
                    title: "Успех",
                    message: "Продукт успешно обновлен",
                    color: "green"
                });
            }
            else {
                await create.mutateAsync(data);
                notifications.show({
                    title: "Успех",
                    message: "Продукт успешно создан",
                    color: "green"
                });
            }
            onClose();
            form.reset();
        }
        catch (e) {
            notifications.show({
                title: "Провал",
                message: "Сохранение провалено успешно",
                color: "red"
            });
        }
    };
    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            <Stack gap="md">
                <Controller name="imgUrls" control={form.control} render={() => <></>}></Controller>
                <TextInput label="Название" {...form.register("name")} error={form.formState.errors.name?.message}></TextInput>
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
                        <Group key={i}>
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
                    <Controller name="calories" control={form.control} render={({field}) => (
                        <NumberInput label="Калории (ккал в 100г)" value={field.value} onChange={
                            (x) => field.onChange(x === "" ? 0 : x)
                        } error={form.formState.errors.calories?.message}></NumberInput>
                    )}></Controller>
                    <Controller name="protein" control={form.control} render={({field}) => (
                        <NumberInput label="Белки (в 100г)" value={field.value} onChange={
                            (x) => field.onChange(x === "" ? 0 : x)
                        } error={form.formState.errors.protein?.message}></NumberInput>
                    )}></Controller>
                    <Controller name="fats" control={form.control} render={({field}) => (
                        <NumberInput label="Жиры (в 100г)" value={field.value} onChange={
                            (x) => field.onChange(x === "" ? 0 : x)
                        } error={form.formState.errors.fats?.message}></NumberInput>
                    )}></Controller>
                    <Controller name="carbs" control={form.control} render={({field}) => (
                        <NumberInput label="Углеводы (в 100г)" value={field.value} onChange={
                            (x) => field.onChange(x === "" ? 0 : x)
                        } error={form.formState.errors.carbs?.message}></NumberInput>
                    )}></Controller>
                </Group>
                <Controller name="category" control={form.control} render={({field}) => (
                    <Select label="Категория" data={[
                        { value: "FROZEN", label: "Замороженный" },
                        { value: "MEAT", label: "Мясной" },
                        { value: "VEGETABLES", label: "Овощи" },
                        { value: "HERBS", label: "Зелень" },
                        { value: "SPICES", label: "Специи" },
                        { value: "CEREALS", label: "Крупы" },
                        { value: "CANNED_GOODS", label: "Консервы" },
                        { value: "LIQUIDS", label: "Жидкость" },
                        { value: "SWEETS", label: "Сладости" },
                    ]} value={field.value} onChange={field.onChange}></Select>
                )}></Controller>
                <Controller name="status" control={form.control} render={({field}) => (
                    <Select label="Необходимость готовки" data={[
                        { value: "READY", label: "Готовый к употреблению" },
                        { value: "SEMI_FINISHED", label: "Полуфабрикат" },
                        { value: "NOT_DONE", label: "Требует приготовления" },
                    ]} value={field.value} onChange={field.onChange}></Select>
                )}></Controller>
                <Controller name="flags" control={form.control} render={({field}) => (
                    <MultiSelect label="Дополнительные флаги" data={[
                        { value: "VEGAN", label: "Веган" },
                        { value: "NO_GLUTEN", label: "Без глютена" },
                        { value: "NO_SUGAR", label: "Без сахара" },
                    ]} value={field.value} onChange={field.onChange}></MultiSelect>
                )}></Controller>
                <Textarea label="Состав" {...form.register("composition")}></Textarea>
                <Group mt="md">
                    <Button type="submit" loading={create.isPending || update.isPending}>
                        {isEdit ? "Сохранить изменения" : "Создать"}
                    </Button>
                    <Button variant="light" onClick={onClose}>Отмена</Button>
                </Group>
            </Stack>
        </form>
    );
};