import { useState } from "react";
import type { AdditionalFlag, CookingStatus, ProductCategory } from "../models/enums";
import { useDeleteProduct, useProducts } from "../hooks/useProducts";
import { ActionIcon, Button, Group, Modal, MultiSelect, Select, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { ProductForm } from "../components/ProductForm";
import { notifications } from "@mantine/notifications";
import { COOKING_STATUS_LABELS, FLAG_LABELS, PRODUCT_CATEGORY_LABELS } from "../components/labels";

export const ProductsPage = () => {
    const [category, setCategory] = useState<ProductCategory | undefined>();
    const [status, setStatus] = useState<CookingStatus | undefined>();
    const [flags, setFlags] = useState<AdditionalFlag[]>([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("name");
    const {data: prods = [], isLoading} = useProducts({
        category, status, flags, search, sortBy
    });
    const deleteProd = useDeleteProduct();
    const [opened, setOpened] = useState(false);
    const [editProduct, setEditProduct] = useState<any>(null);
    const [viewProduct, setViewProduct] = useState<any>(null);
    const onDelete = async (id: number) => {
        if (confirm("Удалить продукт?")) {
            try {
                await deleteProd.mutateAsync(id);
            }
            catch (e: any) {
                const msg = e.response?.data?.message || "Не удалось удалить продукт";
                notifications.show({
                    title: "Ошибка",
                    message: msg,
                    color: "red"
                });
            }
        }
    };
    return (
        <>
            <Title order={2} mb="md">Продукты</Title>
            <Stack>
                <Group align="end" wrap="wrap">
                    <Select label="Категория" placeholder="Все" clearable data={[
                        { value: 'FROZEN', label: 'Замороженный' },
                        { value: 'MEAT', label: 'Мясной' },
                        { value: 'VEGETABLES', label: 'Овощи' },
                        { value: 'HERBS', label: 'Зелень' },
                        { value: 'SPICES', label: 'Специи' },
                        { value: 'CEREALS', label: 'Крупы' },
                        { value: 'CANNED_GOODS', label: 'Консервы' },
                        { value: 'LIQUIDS', label: 'Жидкость' },
                        { value: 'SWEETS', label: 'Сладости' }
                    ]} value={category} onChange={
                        (x) => setCategory(x as ProductCategory)
                    }></Select>
                    <Select label="Статус" placeholder="Все" clearable data={[
                        { value: 'READY', label: 'Готовый' },
                        { value: 'SEMI_FINISHED', label: 'Полуфабрикат' },
                        { value: 'NOT_DONE', label: 'Требует готовки' }
                    ]} value={status} onChange={
                        (x) => setStatus(x as CookingStatus)
                    }></Select>
                    <MultiSelect label="Флаги" placeholder="Все" data={[
                        { value: 'VEGAN', label: 'Веган' },
                        { value: 'NO_GLUTEN', label: 'Без глютена' },
                        { value: 'NO_SUGAR', label: 'Без сахара' }
                    ]} value={flags} onChange={
                        (x) => setFlags(x as AdditionalFlag[])
                    }></MultiSelect>
                    <TextInput label="Поиск по названию" placeholder="Имя" value={search} onChange={
                        (e) => setSearch(e.target.value)
                    }></TextInput>
                    <Select label="Сортировка" value={sortBy} onChange={
                        (x) => setSortBy(x as string)
                    } data={[
                        { value: 'name', label: 'По названию' },
                        { value: 'calories', label: 'По калориям' },
                        { value: 'protein', label: 'По белкам' },
                        { value: 'fats', label: 'По жирам' },
                        { value: 'carbs', label: 'По углеводам' }
                    ]}></Select>
                    <Button onClick={() => {
                        setEditProduct(null);
                        setOpened(true);
                    }}>+ Новый продукт</Button>
                </Group>

                <Table striped highlightOnHover withTableBorder>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Название</Table.Th>
                            <Table.Th>Категория</Table.Th>
                            <Table.Th>Калории</Table.Th>
                            <Table.Th>БЖУ (г/100г)</Table.Th>
                            <Table.Th>Флаги</Table.Th>
                            <Table.Th>Действия</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {isLoading ? (
                            <Table.Tr>
                                <Table.Td colSpan={6}>Загрузка.</Table.Td>
                            </Table.Tr>
                        ) : (
                            prods.map(p => (
                                <Table.Tr key={p.id} onClick={() => setViewProduct(p)}>
                                    <Table.Td>{p.name}</Table.Td>
                                    <Table.Td>{PRODUCT_CATEGORY_LABELS[p.category] || p.category}</Table.Td>
                                    <Table.Td>{p.calories}</Table.Td>
                                    <Table.Td>{p.protein} / {p.fats} / {p.carbs}</Table.Td>
                                    <Table.Td>{p.flags.map(f => FLAG_LABELS[f] || f).join(', ') || '—'}</Table.Td>
                                    <Table.Td>
                                        <Group gap="xs">
                                            <ActionIcon color="blue" onClick={(e) => {
                                                e.stopPropagation();
                                                setEditProduct(p);
                                                setOpened(true);
                                            }}>
                                                <IconEdit size={18}></IconEdit>
                                            </ActionIcon>
                                            <ActionIcon color="red" onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(p.id)
                                            }}>
                                                <IconTrash size={18}></IconTrash>
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))
                        )}
                    </Table.Tbody>
                </Table>
            </Stack>
            <Modal size="lg" opened={opened} onClose={() => {
                setOpened(false);
                setEditProduct(null);
            }} title={editProduct ? "Редактирование продукта" : "Создание нового продукта"}>
                <ProductForm product={editProduct} onClose={() => {
                    setOpened(false);
                    setEditProduct(null);
                }}></ProductForm>
            </Modal>
            <Modal opened={!!viewProduct} onClose={
                () => setViewProduct(null)
            } title="Просмотр продукта" size="lg">
                {viewProduct && (
                    <Stack>
                        <Text><b>Название:</b> {viewProduct.name}</Text>
                        <Text><b>Категория:</b> {PRODUCT_CATEGORY_LABELS[viewProduct.category] || viewProduct.category}</Text>
                        <Text><b>Статус:</b> {COOKING_STATUS_LABELS[viewProduct.status] || viewProduct.status}</Text>
                        <Text><b>КБЖУ (100 г):</b> {viewProduct.calories} / {viewProduct.protein} / {viewProduct.fats} / {viewProduct.carbs}</Text>
                        <Text><b>Состав:</b> {viewProduct.composition || "-"}</Text>
                        <Text><b>Доп флаги:</b> {viewProduct.flags.map((f: string) => FLAG_LABELS[f] || f).join(", ") || "-"}</Text>
                        <Text><b>Фото:</b></Text>
                        {viewProduct.imgUrls?.map((url: string) => (
                            <img src={url} key={url} alt={viewProduct.name} style={{ maxWidth: 200, maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x200?text=No+Image'; }}></img>
                        ))}
                        <Text><b>Дата создания:</b> {new Date(viewProduct.createdAt).toLocaleString()}</Text>
                        {viewProduct.updatedAt && (
                            <Text><b>Дата последнего обновления:</b> {new Date(viewProduct.updatedAt).toLocaleString()}</Text>
                        )}
                    </Stack>
                )}
            </Modal>
        </>
    ); 
};