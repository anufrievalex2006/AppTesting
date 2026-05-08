import { useState } from 'react';
import {
  Button,
  Group,
  Select,
  MultiSelect,
  TextInput,
  Table,
  ActionIcon,
  Modal,
  Title,
  Stack,
  Text,
} from '@mantine/core';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { useDishes, useDeleteDish } from '../hooks/useDishes';
import { DishForm } from '../components/DishForm';
import type { DishCategory, AdditionalFlag } from '../models/enums';
import { notifications } from '@mantine/notifications';

export const DishesPage = () => {
  const [category, setCategory] = useState<DishCategory | undefined>();
  const [flags, setFlags] = useState<AdditionalFlag[]>([]);
  const [search, setSearch] = useState('');

  const { data: dishes = [], isLoading } = useDishes({ category, flags, search });
  const deleteDish = useDeleteDish();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDish, setEditingDish] = useState<any>(null);
  const [viewDish, setViewDish] = useState<any>(null);

  const handleDelete = async (id: number) => {
    if (confirm("Удалить блюдо?")) {
      try {
          await deleteDish.mutateAsync(id);
      }
      catch (e: any) {
          const msg = e.response?.data?.message || "Не удалось удалить блюдо";
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
      <Title order={2} mb="md">Блюда</Title>

      <Group align="end" wrap="wrap" mb="lg">
        <Select
          label="Категория"
          placeholder="Все"
          clearable
          data={[
            { value: 'DESSERT', label: 'Десерт' },
            { value: 'FIRST', label: 'Первое' },
            { value: 'SECOND', label: 'Второе' },
            { value: 'DRINK', label: 'Напиток' },
            { value: 'SALAD', label: 'Салат' },
            { value: 'SOUP', label: 'Суп' },
            { value: 'SNACK', label: 'Перекус' },
          ]}
          value={category}
          onChange={(v) => setCategory(v as DishCategory)}
        />

        <MultiSelect
          label="Флаги"
          placeholder="Все"
          data={[
            { value: 'VEGAN', label: 'Веган' },
            { value: 'NO_GLUTEN', label: 'Без глютена' },
            { value: 'NO_SUGAR', label: 'Без сахара' },
          ]}
          value={flags}
          onChange={
            (x) => setFlags(x as AdditionalFlag[])
          }
        />

        <TextInput
          label="Поиск по названию"
          placeholder="Введите название..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Button onClick={() => { setEditingDish(null); setModalOpen(true); }}>
          + Новое блюдо
        </Button>
      </Group>

      <Table striped highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Название</Table.Th>
            <Table.Th>Категория</Table.Th>
            <Table.Th>Порция (г)</Table.Th>
            <Table.Th>КБЖУ</Table.Th>
            <Table.Th>Флаги</Table.Th>
            <Table.Th>Действия</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {isLoading ? (
            <Table.Tr><Table.Td colSpan={6}>Загрузка...</Table.Td></Table.Tr>
          ) : (
            dishes.map((d) => (
              <Table.Tr key={d.id} onClick={() => setViewDish(d)}>
                <Table.Td>{d.name}</Table.Td>
                <Table.Td>{d.category}</Table.Td>
                <Table.Td>{d.portionSize}</Table.Td>
                <Table.Td>
                  {d.calories} / {d.protein} / {d.fats} / {d.carbs}
                </Table.Td>
                <Table.Td>{d.flags.join(', ') || '—'}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      color="blue"
                      onClick={(e) => { e.stopPropagation(); setEditingDish(d); setModalOpen(true); }}
                    >
                      <IconEdit size={18} />
                    </ActionIcon>
                    <ActionIcon color="red" onClick={(e) => { e.stopPropagation(); handleDelete(d.id); }}>
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Modal
        opened={modalOpen}
        onClose={() => { setModalOpen(false); setEditingDish(null); }}
        title={editingDish ? 'Редактировать блюдо' : 'Новое блюдо'}
        size="xl"
      >
        <DishForm
          dish={editingDish}
          opened={modalOpen}
          onClose={() => { setModalOpen(false); setEditingDish(null); }}
        />
      </Modal>
      <Modal
        opened={!!viewDish}
        onClose={() => setViewDish(null)}
        title="Просмотр блюда"
        size="xl"
      >
        {viewDish && (
          <Stack>
            <Text><b>Название:</b> {viewDish.name}</Text>
            <Text><b>Категория:</b> {viewDish.category}</Text>
            <Text><b>Размер порции:</b> {viewDish.portionSize} г</Text>
            <Text><b>КБЖУ на порцию:</b> {viewDish.calories} / {viewDish.protein} / {viewDish.fats} / {viewDish.carbs}</Text>
            <Text><b>Состав:</b></Text>
            {viewDish.ingredients.map((ing: any, idx: number) => (
              <Text key={idx}>{ing.product.name} — {ing.quantity} г</Text>
            ))}
            <Text><b>Флаги:</b> {viewDish.flags.join(', ') || '—'}</Text>
            <Text><b>Фото:</b></Text>
            {viewDish.imgUrls?.map((url: string) => (
              <img src={url} key={url} alt={viewDish.name} style={{ maxWidth: 200, maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x200?text=No+Image'; }}></img>
            )) || '—'}
            <Text><b>Дата создания:</b> {new Date(viewDish.createdAt).toLocaleString()}</Text>
            {viewDish.updatedAt && (
              <Text><b>Дата последнего обновления:</b> {new Date(viewDish.updatedAt).toLocaleString()}</Text>
            )}
          </Stack>
        )}
      </Modal>
    </>
  );
}