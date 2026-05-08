import { Button, Stack } from "@mantine/core";
import { NavLink } from "react-router-dom";
import { IconList, IconChefHat } from '@tabler/icons-react';

export const Navbar = () => {
    return (
        <Stack>
            <Button component={NavLink} to="/" variant="light" leftSection={<IconList size={20}></IconList>}>
                Продукты
            </Button>
            <Button component={NavLink} to="/dishes" variant="light" leftSection={<IconChefHat size={20}></IconChefHat>}>
                Блюда
            </Button>
        </Stack>
    );
};